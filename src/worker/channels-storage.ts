import {Collection, Guild, NonThreadGuildBasedChannel, TextChannel} from 'discord.js';
import {addChannelMessageTracker, beginTransaction, commit, getAllChannelMessageTrackers, rollback} from "../db/sqlite";
import {config} from '../config';


export let currentTextChannel: TextChannel | null;
export let currentTrackedChannel: ChannelMessageTracker | null;
let channelTracker: ChannelMessageTracker[] | undefined;
let channels: Collection<string, NonThreadGuildBasedChannel | null>;

export async function storeChannels(guild: Guild | undefined) {
    if (!guild) return;
    channels = await guild.channels.fetch();


    channelTracker = await getAllChannelMessageTrackers();

    try {
        await beginTransaction()
        for (const channel of channels.values()) {
            if (!channel?.id || channel?.type !== 0) continue;

            let exist = false;
            if (channelTracker) {
                exist = channelTracker.some(track => track.channel_id === channel.id);
            }

            if (!exist) {
                if (channel.parent?.id === config.GAME_CATEGORY_ID || channel.parent?.id === config.TEXT_CHANNEL_ID) {
                    try {
                        await addChannelMessageTracker(channel.id);
                        console.log(`Added tracker for channel: ${channel.id}`);
                    } catch (error) {
                        console.error(`Error adding tracker for channel ${channel.id}:`, error);
                    }
                }
            }
        }

        await commit()

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
    } catch (e) {
        await rollback();
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