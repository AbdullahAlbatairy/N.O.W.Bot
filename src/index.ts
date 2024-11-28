import { ActivityType, Client } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
import { connect } from './db/sqlite';
import { messageListener } from "./listener/message-listener";
import { storeChannels } from "./worker/channels-storage";
import { setupBackwardWorker, setupForwardWorker } from "./worker/channel-messages-worker";


export const serverEmojisName: (string | null)[] = [];
export const client = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"],
});

client.once("ready", async () => {
    await connect();
    let guild = client.guilds.cache.get(config.SERVER_ID);
    if (guild) {
        await storeChannels(guild).then(async () => {
            await setupBackwardWorker()
            // await setupForwardWorker()
        })
    }

    const serverEmojis = client.guilds.cache.get(config.SERVER_ID)?.emojis;
    serverEmojis?.cache.forEach(emoji => {
        if (!emoji.animated)
            serverEmojisName.push(`<:${emoji.name}:${emoji.id}>`);
    })

    await deployCommands();
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
        await commands[commandName as keyof typeof commands].execute(interaction);
    }
});


messageListener().then(() =>
    console.log("Emoji Message Listener is ready"));

client.login(config.DISCORD_TOKEN).then(() => {
    client.user?.setPresence({
        activities: [{
            name: 'test',
            type: ActivityType.Custom,
        }],
        status: 'online'
    });

}
);

