import { client } from '../index'
import { beginTransaction, commit, addMessage, addEmoji, rollback, getAllMessages, getAllEmojis, getEmojisCount, increaseEmojiCount, deleteMessage, reduceEmojiCount, addChannelMessageTracker, getAllChannelMessageTrackers, getMessage } from '../db/sqlite';
import { v4 as uuid } from 'uuid';



export async function emojiMessageListener() {
    createListener()
    updateListener()
    deleteListener()
}

async function createListener() {
    client.on("messageCreate", async (message) => {
        if (message.author.bot) return;

        const discordEmojiRegExp = /<:([\w]+):\d+>/g;

        const messageId = message.id
        const messageAuthor = message.author.id
        const match = message.content.match(discordEmojiRegExp)
        const channelId = message.channel.id
        if (match) {
            try {
                beginTransaction()
                addMessage(messageId, messageAuthor)
                match.forEach(async (emoji) => {
                    const emojiId = uuid()
                    addEmoji(emojiId, emoji, messageId)
                    increaseEmojiCount(emoji)
                })
                addChannelMessageTracker(channelId, messageId)
                commit()
            }
            catch (e) {
                rollback()
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


        const discordEmojiRegExp = /<:([\w]+):\d+>/g;



        const oldMessageId = oldMessage.id
        const oldMatch = oldMessage.content?.match(discordEmojiRegExp)

        if (oldMatch) {
            try {
                beginTransaction()
                deleteMessage(oldMessageId)
                oldMatch.forEach(async (emoji) => {
                    reduceEmojiCount(emoji)
                })
                commit()
            }
            catch (e) {
                rollback()
            }
        }

        const messageId = newMessage.id
        const messageAuthor = newMessage.author?.id
        const match = newMessage.content?.match(discordEmojiRegExp)

        if (match) {
            try {
                beginTransaction()
                addMessage(messageId, messageAuthor)
                match.forEach(async (emoji) => {
                    const emojiId = uuid()
                    addEmoji(emojiId, emoji, messageId)
                    increaseEmojiCount(emoji)
                })
                commit()
            }
            catch (e) {
                rollback()
            }
        }

    });
}
async function deleteListener() {
    client.on("messageDelete", async (message) => {
        if (message.author?.bot) return;
        const messageExist = await getMessage(message.id);
        if (!messageExist) return

        const discordEmojiRegExp = /<:([\w]+):\d+>/g;

        const oldMessageId = message.id
        const oldMatch = message.content?.match(discordEmojiRegExp)

        if (oldMatch) {
            try {
                beginTransaction()
                deleteMessage(oldMessageId)
                oldMatch.forEach(async (emoji) => {
                    reduceEmojiCount(emoji)
                })
                commit()
            }
            catch (e) {
                rollback()
            }
        }

    });
}

