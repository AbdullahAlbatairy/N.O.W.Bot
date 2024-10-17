import {Guild} from 'discord.js';
import {addChannelMessageTracker, beginTransaction, commit, getAllChannelMessageTrackers, rollback} from "../db/sqlite";


export async function channelsStorage(guild: Guild | undefined) {
    if (!guild) return;
    const channels = await guild.channels.fetch();


    const tracker = await getAllChannelMessageTrackers();

    try {
        await beginTransaction()
        channels.forEach(async channel => {
            let exist = false;
            if (tracker) {
                for (const track of tracker) {
                    if (track.channel_id === channel?.id) {
                        exist = true;
                        break;
                    }
                }
            }
            if (!exist && channel?.id && channel?.type === 0) {
                await addChannelMessageTracker(channel.id);
            }
        })
        await commit()
    } catch (e) {
        await rollback();
    }


}