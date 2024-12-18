import { client, serverEmojisName } from '../index'
import {
    addMessage,
    addEmoji,
    deleteMessage,
    getMessage, updateChannelMessageTracker,
    prisma,
    getChannelMessageTracker
} from '../db/sqlite';
import { v4 as uuid } from 'uuid';
import { discordEmojiRegExp } from "../constant";
import { channelsMessageTrackerList } from '../worker/channels-storage';


export async function messageListener() {
    await createListener()
    await updateListener()
    await deleteListener()
}

async function createListener() {
    client.on("messageCreate", async (message) => {
        const messageId = message.id
        const messageAuthor = message.author.id
        const channelId = message.channel.id
        const createdAt = message.createdTimestamp
        if (message.author.bot) {
            if (channelsMessageTrackerList?.some(channel => channel.channelId === channelId)) {
                await updateChannelMessageTracker(prisma, false, channelId, messageId)
            }
            return;
        }
        let match = message.content.match(discordEmojiRegExp)

        if (match) {
            let isMatchingServerEmoji = false;
            match.forEach(m => {
                if (serverEmojisName.some(name => name === m)) isMatchingServerEmoji = true;
            })
            if (isMatchingServerEmoji) {
                prisma.$transaction(async (prisma) => {
                    await addMessage(prisma, message.channel.id, messageId, messageAuthor, createdAt)
                    for (const emoji of match) {
                        if (!serverEmojisName.some(name => name === emoji)) continue; //the check again because if one message has two emojis one from the server and another one not from the server it will add both, so this remove the second one
                        const emojiId = uuid();
                        try {
                            await addEmoji(prisma, emojiId, emoji, messageId);
                            console.log(`Processed emoji: ${emoji} for message: ${messageId}`);
                        } catch (error) {
                            console.error(`Error processing emoji ${emoji} for message ${messageId}:`, error);
                        }
                    }
                    await updateChannelMessageTracker(prisma, false, channelId, messageId)
                })
            } else {
            }

        } else {
            await updateChannelMessageTracker(prisma, false, channelId, messageId)
        }
    })
}

async function updateListener() {
    client.on("messageUpdate", async (oldMessage, newMessage) => {
        if (newMessage.author?.bot || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return
        const messageExist = await getMessage(prisma, oldMessage.id)
        if (!messageExist) return


        const oldMessageId = oldMessage.id
        const oldMatch = oldMessage.content?.match(discordEmojiRegExp)

        if (oldMatch) {
            let isMatchingServerEmoji = false;
            oldMatch.forEach(m => {
                if (serverEmojisName.some(name => name === m)) isMatchingServerEmoji = true;
            })
            if (isMatchingServerEmoji) {
                prisma.$transaction(async (prisma) => {
                    await deleteMessage(prisma, oldMessageId)
                })
            }
        }

        const messageId = newMessage.id
        const channelId = newMessage.channel.id
        const messageAuthor = newMessage.author?.id
        const createdAt = newMessage.createdTimestamp
        const match = newMessage.content?.match(discordEmojiRegExp)

        if (match) {
            let isMatchingServerEmoji = false;
            match.forEach(m => {
                if (serverEmojisName.some(name => name === m)) isMatchingServerEmoji = true;
            })
            if (isMatchingServerEmoji) {
                prisma.$transaction(async (prisma) => {

                    await addMessage(prisma, channelId, messageId, messageAuthor as string, createdAt)
                    for (const emoji of match) {
                        if (!serverEmojisName.some(name => name === emoji)) continue;
                        const emojiId = uuid();
                        try {
                            await addEmoji(prisma, emojiId, emoji, messageId);
                            console.log(`Processed emoji: ${emoji} for message: ${messageId}`);
                        } catch (error) {
                            console.error(`Error processing emoji ${emoji} for message ${messageId}:`, error);
                        }
                    }

                })
            }
        }

    });
}

async function deleteListener() {
    client.on("messageDelete", async (message) => {
        const channelId = message.channel.id
        const channelMessageTracker = await getChannelMessageTracker(prisma, channelId);

        if (message.id === channelMessageTracker?.fromMessageId) {
            const prevMessages = await message.channel.messages.fetch({
                limit: 1,
                before: channelMessageTracker?.fromMessageId ?? undefined
            })

            await updateChannelMessageTracker(prisma, false, channelId, prevMessages?.first()?.id, undefined)
        }
        if (message.author?.bot) return;
        const messageExist = await getMessage(prisma, message.id);
        if (!messageExist) return

        const discordEmojiRegExp = /<:(\w+):\d+>/g;

        const oldMessageId = message.id
        const oldMatch = message.content?.match(discordEmojiRegExp)

        if (oldMatch) {
            let isMatchingServerEmoji = false;
            oldMatch.forEach(m => {
                if (serverEmojisName.some(name => name === m)) isMatchingServerEmoji = true;
            })
            if (isMatchingServerEmoji) {
                prisma.$transaction(async (prisma) => {
                    await deleteMessage(prisma, oldMessageId)
                })
            }
        }
    });
}

