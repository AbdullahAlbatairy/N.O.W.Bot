import {CronJob} from "cron"
import {
    addEmoji,
    addMessage,
    beginTransaction, commit,
    increaseEmojiCount, rollback, updateChannelMessageTracker
} from "../db/sqlite";
import {currentTextChannel, currentTrackedChannel, updateChannelTracker} from "./channels-storage";
import {v4 as uuid} from "uuid";
import {discordEmojiRegExp} from "../constant";
import {serverEmojisName} from "../index";

let workerJob: CronJob | null = null;
const RIYADH_TIME_ZONE = "Asia/Riyadh"

export async function setupBackwardWorker() {

    new CronJob('00 10 * * *', () => {
        console.log(`Starting worker at ${new Date().toISOString()}`);
        workerJob = new CronJob('*/4 * * * * *', async () => {
            console.log(`Worker running at ${new Date().toISOString()}`);
            await emojisBackwardScanner()
        }, null, true, RIYADH_TIME_ZONE)

    }, null, true, RIYADH_TIME_ZONE)


    new CronJob('0 20 * * *', () => {
        if (workerJob) {
            workerJob.stop();
            workerJob = null;
        }
    }, null, true, RIYADH_TIME_ZONE)

    console.log("Worker scheduled to run daily from 12:00 AM to 4:00 AM (Riyadh time)");
}


async function emojisBackwardScanner() {
    if (!currentTrackedChannel || !currentTextChannel) {
        console.log("There is no more channel to scan for emojis. Stopping the worker");
        workerJob?.stop();
        workerJob = null;
        return;
    }


    try {
        await beginTransaction();

        const messages = await currentTextChannel.messages.fetch({
            limit: 100,
            before: currentTrackedChannel.to_message_id ?? undefined
        });

        if (!messages) {
            await commit();
            return;
        }

        if (messages.size < 100) {
            await updateChannelMessageTracker(currentTrackedChannel.channel_id, undefined, undefined, 1);
        }

        if (messages.size === 0) {
            await updateChannelTracker();
            await commit();
            return;
        }

        for (const message of messages.values()) {
            if (message.author.bot) {
                await updateChannelMessageTracker(message.channel.id, undefined, message.id);
                continue;
            }
            const match = message.content.match(discordEmojiRegExp);
            if (match) {
                let isMatchingServerEmoji = false;
                match.forEach(m => {
                    if (serverEmojisName.some(name => name === m)) isMatchingServerEmoji = true;
                })
                if (isMatchingServerEmoji) {
                    console.log(`${message.author.displayName} - ${message.id} - ${message.channel.id} - ${message.content}`);
                    await addMessage(message.id, message.author.id);
                    for (const emoji of match) {
                            const emojiId = uuid();
                            await addEmoji(emojiId, emoji, message.id);
                            await increaseEmojiCount(emoji);
                    }
                }
            }

            await updateChannelMessageTracker(message.channel.id, undefined, message.id);
        }

        await updateChannelTracker();
        await commit();
    } catch (e: any) {
        console.error('Error processing messages:', e);
        await rollback();
        if (e.code === 'SQLITE_CONSTRAINT') {
            console.error('Foreign key constraint failed. Skipping this batch of messages.');
        } else {
            throw e;
        }
    }
}



