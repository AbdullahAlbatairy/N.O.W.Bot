import {ActivityType, Client} from "discord.js";
import {deployCommands} from "./deploy-commands";
import {commands} from "./commands";
import {config} from "./config";
import {connect, createTable} from './db/sqlite';
import {emojiMessageListener} from "./listener/emoji-message-listener";
import {channelsStorage} from "./worker/channels-storage";
import {worker} from "./worker/channel-messages-worker";

export const client = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"],
});


client.once("ready", async () => {
    await connect('./data/N.O.W.db');
    await createTable();
    const guild = client.guilds.cache.get(config.SERVER_ID);
    if (guild) {
        await channelsStorage(guild).then(() => worker())
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
    const {commandName} = interaction;
    if (commands[commandName as keyof typeof commands]) {
        await commands[commandName as keyof typeof commands].execute(interaction);
    }
});


emojiMessageListener().then(r =>
    console.log("Emoji Message Listener is ready"));

client.login(config.DISCORD_TOKEN).then((user) => console.log("I am logged in!!"));
// console.log(client.user)
// client.user?.setPresence({
//     activities: [{
//         name: 'with depression',
//         type: ActivityType.Custom,
//     }],
//     status: 'online'
// });
