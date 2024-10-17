import {CronJob} from "cron"
import {
    addEmoji,
    addMessage,
    beginTransaction, commit,
    increaseEmojiCount, rollback, updateChannelMessageTracker
} from "../db/sqlite";
import {currentTextChannel, currentTrackedChannel, updateChannelTracker} from "./channels-storage";
import {v4 as uuid} from "uuid";


//run only when the time is 12am up to 4am => Done
//get one channel at a time and go through it each night => Done
//check if the there is a message pointer stored in db, if not, start from the beginning
//store the first start message, and begin scanning backward with storing the pointer for the current message
//

let workerJob: CronJob | null = null;
const RIYADH_TIME_ZONE = "Asia/Riyadh"

export async function setupBackwardWorker() {


    new CronJob('09 20 * * *', () => {
        console.log(`Starting worker at ${new Date().toISOString()}`);
        workerJob = new CronJob('*/5 * * * * *', async () => {
            console.log(`Worker running at ${new Date().toISOString()}`);
            await emojisBackwardScanner()
        }, null, true, RIYADH_TIME_ZONE)

    }, null, true, RIYADH_TIME_ZONE)


    new CronJob('0 4 * * *', () => {
        if (workerJob) {
            workerJob.stop();
            workerJob = null;
        }
    }, null, true, RIYADH_TIME_ZONE)

    console.log("Worker scheduled to run daily from 12:00 AM to 4:00 AM (Riyadh time)");
}


async function emojisBackwardScanner() {
    if (!currentTrackedChannel || !currentTextChannel) {
        console.log("there is no more channel to scan for emojis. stopping the worker")
        workerJob?.stop();
        workerJob = null;
        return;
    }
    const messages = await currentTextChannel.messages.fetch({
        limit: 100,
        before: currentTrackedChannel.to_message_id ?? undefined
    });

    if (!messages) return;
    if (messages.size < 100) await updateChannelMessageTracker(currentTrackedChannel.channel_id, undefined, undefined, 1);
    if (messages.size === 0) {
        await updateChannelMessageTracker(currentTrackedChannel.channel_id, undefined, undefined, 1);
        await updateChannelTracker()
    }
    const discordEmojiRegExp = /<:([\w]+):\d+>/g;

    for (const message of messages.values()) {
        if (message.author.bot) continue;
        console.log(`${message.author.displayName} - ${message.id} - ${message.channel.id}`);

        const match = message.content.match(discordEmojiRegExp);
        if (!match) {
            await updateChannelMessageTracker(message.channel.id, undefined, message.id);
            await updateChannelTracker();
            continue
        }

        try {
            await beginTransaction();

            await addMessage(message.id, message.author.id);

            for (const emoji of match) {
                const emojiId = uuid();
                await addEmoji(emojiId, emoji, message.id);
                await increaseEmojiCount(emoji);
            }

            await updateChannelMessageTracker(message.channel.id, undefined, message.id);

            await commit();
            await updateChannelTracker();
        } catch (e: any) {
            console.error('Error processing message:', message.id, e);
            await rollback();

            if (e.code === 'SQLITE_CONSTRAINT') {
                console.error('Foreign key constraint failed. Skipping this message.');
                continue;
            }

            throw e;
        }
    }
}



