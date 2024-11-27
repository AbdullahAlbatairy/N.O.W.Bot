import { Collection, Guild, NonThreadGuildBasedChannel, TextChannel } from 'discord.js';
import { addChannelMessageTracker, getAllChannelMessageTrackers, getChannelMessageTracker, prisma } from "../db/sqlite";
import { config } from '../config';


export let currentBackwardTextChannel: TextChannel | null;
export let currentBackwardTrackedChannel: ChannelMessageTracker | null;
export let currentForwardTextChannel: TextChannel | null;
export let currentForwardTrackedChannel: ChannelMessageTracker | null;
export let channelsMessageTrackerList: ChannelMessageTracker[] | undefined;
let channels: Collection<string, NonThreadGuildBasedChannel | null>;

export async function storeChannels(guild: Guild | undefined) {
    if (!guild) return;
    channels = await guild.channels.fetch();


    channelsMessageTrackerList = await getAllChannelMessageTrackers();

    prisma.$transaction(async (prisma) => {
        for (const channel of channels.values()) {
            if (!channel?.id || channel?.type !== 0) continue;

            let exist = false;
            if (channelsMessageTrackerList) {
                exist = channelsMessageTrackerList.some(track => track.channelId === channel.id);
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

    if (!channelsMessageTrackerList) channelsMessageTrackerList = await getAllChannelMessageTrackers();

    if (channelsMessageTrackerList) {
        for (const channel of channelsMessageTrackerList) {
            let isBackwardReady = false;
            let isForwardReady = false;
            if (!channel.isFinished) {
                currentBackwardTrackedChannel = channel;
                currentBackwardTextChannel = channels.get(`${channel.channelId}`) as TextChannel
                isBackwardReady = true;

            }
            if (channel.fromMessageId) {
                currentForwardTrackedChannel = channel;
                currentForwardTextChannel = channels.get(`${channel.channelId}`) as TextChannel
                isForwardReady = true;
            }

            if (isBackwardReady && isForwardReady) {
                break;
            }
        }
    }
}


export async function updateBackwardChannelTracker() {
    currentBackwardTrackedChannel = null;
    currentBackwardTextChannel = null
    channelsMessageTrackerList = await getAllChannelMessageTrackers();
    if (channelsMessageTrackerList) {
        for (const channel of channelsMessageTrackerList) {
            if (!channel.isFinished) {
                currentBackwardTrackedChannel = channel;
                currentBackwardTextChannel = channels.get(`${channel.channelId}`) as TextChannel
                break;
            }
        }
    }


}


export async function updateForwardChannelTracker() {
    currentForwardTrackedChannel = null;
    currentForwardTextChannel = null
    let trackedChannel: ChannelMessageTracker | null = null;
    let textChannel: TextChannel | null = null
    channelsMessageTrackerList = await getAllChannelMessageTrackers();
    if (channelsMessageTrackerList) {
            

        for (const channel of channelsMessageTrackerList) {
            if (channel.fromMessageId) {
                trackedChannel = channel;
                textChannel = channels.get(`${channel.channelId}`) as TextChannel
                const messages = await textChannel.messages.fetch({
                    limit: 100,
                    after: trackedChannel.fromMessageId ?? undefined
                });


                if (messages.size > 0) {
                    currentForwardTrackedChannel = channel;
                    currentForwardTextChannel = channels.get(`${channel.channelId}`) as TextChannel
                    break;
                }
            }

        }
    }
}