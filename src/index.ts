import { Client } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
import { connect, createTable, beginTransaction, commit, addMessage, addEmoji, rollback, getAllMessages, getAllEmojis, getEmojisCount, increaseEmojiCount, deleteMessage, reduceEmojiCount } from './db/sqlite';
import { v4 as uuid } from 'uuid';

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"],
});

let file: Buffer | void;
let json: string;
let count: Map<string, number>;



client.once("ready", async () => {
  // await openEmojiFile();
  await connect('./data/N.O.W.db');
  await createTable();

  console.log("Discord bot is ready! 🤖");

});

client.on("guildCreate", async () => {
  await deployCommands();
});



client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }
  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== "690902062141145128") return //TEST condition
  if (message.author.globalName !== "Human") return // TEST condition

  const discordEmojiRegExp = /<:([\w]+):\d+>/g;

  const messageId = message.id
  const messageAuthor = message.author.id
  const match = message.content.match(discordEmojiRegExp)
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

})


client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (newMessage.author?.bot || oldMessage.author?.bot) return;
  if (newMessage.channel.id !== "690902062141145128" || oldMessage.channel.id !== "690902062141145128") return
  if (newMessage.author?.globalName !== "Human" || oldMessage.author?.globalName !== "Human") return


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
  const messageAuthor = newMessage.author.id
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


client.on("messageDelete", async (message) => {
  if (message.author?.bot) return;
  if (message.channel.id !== "690902062141145128") return
  if (message.author?.globalName !== "Human") return


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

client.login(config.DISCORD_TOKEN);

