import { Collection, Guild, NonThreadGuildBasedChannel, TextChannel } from 'discord.js';
import { addChannelMessageTracker, getAllChannelMessageTrackers, prisma } from "../db/sqlite";
import { config } from '../config';


export let currentTextChannel: TextChannel | null;
export let currentTrackedChannel: ChannelMessageTracker | null;
let channelTracker: ChannelMessageTracker[] | undefined;
let channels: Collection<string, NonThreadGuildBasedChannel | null>;

export async function storeChannels(guild: Guild | undefined) {
    if (!guild) return;
    channels = await guild.channels.fetch();


    channelTracker = await getAllChannelMessageTrackers();

    prisma.$transaction(async (prisma) => {
        for (const channel of channels.values()) {
            if (!channel?.id || channel?.type !== 0) continue;

            let exist = false;
            if (channelTracker) {
                exist = channelTracker.some(track => track.channel_id === channel.id);
            }

            if (!exist) {
                if (channel.parent?.id === config.GAME_CATEGORY_ID || channel.parent?.id === config.TEXT_CHANNEL_ID) {
                    try {
                        await addChannelMessageTracker(prisma, channel.id);
                        console.log(`Added tracker for channel: ${channel.id}`);
                    } catch (error) {
                        console.error(`Error adding tracker for channel ${channel.id}:`, error);
                    }
                }
            }
        }
    })

    if (!channelTracker) channelTracker = await getAllChannelMessageTrackers();

    if (channelTracker) {
        for (const channel of channelTracker) {
            if (!channel.is_finished) {
                currentTrackedChannel = channel;
                currentTextChannel = channels.get(`${channel.channel_id}`) as TextChannel
                console.log(currentTrackedChannel)
                break;
            }
        }
    }
}


export async function updateChannelTracker() {
    currentTrackedChannel = null;
    currentTextChannel = null
    channelTracker = await getAllChannelMessageTrackers();
    if (channelTracker) {
        for (const channel of channelTracker) {
            if (!channel.is_finished) {
                currentTrackedChannel = channel;
                currentTextChannel = channels.get(`${channel.channel_id}`) as TextChannel
                break;
            }
        }
    }


}