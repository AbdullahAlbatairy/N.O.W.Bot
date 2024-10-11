import { Client } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
import { connect, createTable, beginTransaction, commit, addMessage, addEmoji, rollback, getAllMessages, getAllEmojis, getEmojisCount, increaseEmojiCount, deleteMessage, reduceEmojiCount, addChannelMessageTracker, getAllChannelMessageTrackers, getMessage } from './db/sqlite';
import { emojiMessageListener } from "./listener/emoji-message-listener";
import { channelScheduler } from "./scheduler/channel-scheduler";

export const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"],
});




client.once("ready", async () => {
  // await openEmojiFile();
  await connect('./data/N.O.W.db');
  await createTable();
  const guild = client.guilds.cache.get(config.SERVER_ID);
  if (guild) {
    channelScheduler(guild)
  }
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


emojiMessageListener();
// channelScheduler();


client.login(config.DISCORD_TOKEN);

