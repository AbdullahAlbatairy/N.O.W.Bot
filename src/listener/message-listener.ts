import { client, serverEmojisName } from '../index'
import {
    addMessage,
    addEmoji,
    increaseEmojiCount,
    deleteMessage,
    reduceEmojiCount,
    getMessage, updateChannelMessageTracker,
    prisma
} from '../db/sqlite';
import { v4 as uuid } from 'uuid';
import { discordEmojiRegExp } from "../constant";


export async function messageListener() {
    await createListener()
    await updateListener()
    await deleteListener()
}

async function createListener() {
    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

        const messageId = message.id
        const messageAuthor = message.author.id
        const channelId = message.channel.id
        let match = message.content.match(discordEmojiRegExp)

        if (match) {
            let isMatchingServerEmoji = false;
            match.forEach(m => {
                if (serverEmojisName.some(name => name === m)) isMatchingServerEmoji = true;
            })
            if (isMatchingServerEmoji) {
                prisma.$transaction(async (prisma) => {
                    await addMessage(prisma, messageId, messageAuthor)
                    for (const emoji of match) {
                        if (!serverEmojisName.some(name => name === emoji)) continue;
                        const emojiId = uuid();
                        try {
                            await addEmoji(prisma, emojiId, emoji, messageId);
                            await increaseEmojiCount(prisma, emoji);
                            console.log(`Processed emoji: ${emoji} for message: ${messageId}`);
                        } catch (error) {
                            console.error(`Error processing emoji ${emoji} for message ${messageId}:`, error);
                        }
                    }
                    await updateChannelMessageTracker(prisma, channelId, messageId)
                })
            }

        }
    })
}

async function updateListener() {
    client.on("messageUpdate", async (oldMessage, newMessage) => {
        if (newMessage.author?.bot || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return
        const messageExist = await getMessage(oldMessage.id)
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
                    for (const emoji of oldMatch) {
                        try {
                            await reduceEmojiCount(prisma, emoji);
                            console.log(`Reduced count for emoji: ${emoji}`);
                        } catch (error) {
                            console.error(`Error reducing count for emoji ${emoji}:`, error);
                        }
                    }
                })
            }
        }

        const messageId = newMessage.id
        const messageAuthor = newMessage.author?.id
        const match = newMessage.content?.match(discordEmojiRegExp)

        if (match) {
            let isMatchingServerEmoji = false;
            match.forEach(m => {
                if (serverEmojisName.some(name => name === m)) isMatchingServerEmoji = true;
            })
            if (isMatchingServerEmoji) {
                prisma.$transaction(async (prisma) => {

                    await addMessage(prisma, messageId, messageAuthor as string)
                    for (const emoji of match) {
                        const emojiId = uuid();
                        try {
                            await addEmoji(prisma, emojiId, emoji, messageId);
                            await increaseEmojiCount(prisma, emoji);
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
        if (message.author?.bot) return;
        const messageExist = await getMessage(message.id);
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
                    for (const emoji of oldMatch) {
                        try {
                            await reduceEmojiCount(prisma, emoji);
                            console.log(`Reduced count for emoji: ${emoji}`);
                        } catch (error) {
                            console.error(`Error reducing count for emoji ${emoji}:`, error);
                        }
                    }

                })
            }
        }

    });
}

