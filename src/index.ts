import { Client } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
import { promises } from "fs";
import { connect, createTable, beginTransaction, commit, addMessage, addEmoji, rollback, getAllMessages, getAllEmojis, getAllMessageEmojis, getEmojisCount } from './db/sqlite';
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
      match.forEach(async (emoji) => {
        const emojiId = uuid()
        beginTransaction()
        addMessage(messageId, messageAuthor)
        addEmoji(emojiId, emoji, messageId)
        commit()
      })
    }
    catch (e) {
      rollback()
    }
  }

  count = await getEmojisCount();

  count.forEach((value, key) => {
    console.log(key, value)
  })

  const allMessages = await getAllMessages();
  const allEmojis = await getAllEmojis();

  allMessages.forEach((message) => {
    console.log(message)

  })

  allEmojis.forEach((emoji) => {
    console.log(emoji)
  })


})


client.on("messageUpdate", async (message) => {
});


client.on("messageDelete", async (message) => {
});

client.login(config.DISCORD_TOKEN);

