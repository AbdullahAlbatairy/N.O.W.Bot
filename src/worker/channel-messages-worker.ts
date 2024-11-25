import { CronJob } from "cron"
import {
    addEmoji,
    addMessage,
    commit,
    increaseEmojiCount, prisma, updateChannelMessageTracker
} from "../db/sqlite";
import { currentTextChannel, currentTrackedChannel, updateChannelTracker } from "./channels-storage";
import { v4 as uuid } from "uuid";
import { discordEmojiRegExp } from "../constant";
import { serverEmojisName } from "../index";

let backwardWorkerJob: CronJob | null = null;
const RIYADH_TIME_ZONE = "Asia/Riyadh"
let msg: any;

export async function setupBackwardWorker() {

    new CronJob('38 19 * * *', () => {
        console.log(`Starting worker at ${new Date().toISOString()}`);
        backwardWorkerJob = new CronJob('*/4 * * * * *', async () => {
            console.log(`Worker running at ${new Date().toISOString()}`);
            await emojisBackwardScanner()
        }, null, true, RIYADH_TIME_ZONE)

    }, null, true, RIYADH_TIME_ZONE)


    new CronJob('0 20 * * *', () => {
        if (backwardWorkerJob) {
            backwardWorkerJob.stop();
            backwardWorkerJob = null;
        }
    }, null, true, RIYADH_TIME_ZONE)

    console.log("Worker scheduled to run daily from 12:00 AM to 4:00 AM (Riyadh time)");
}


async function emojisBackwardScanner() {
    await prisma.$transaction(async (prisma) => {
        if (!currentTrackedChannel || !currentTextChannel) {
            console.log("There is no more channel to scan for emojis. Stopping the worker");
            backwardWorkerJob?.stop();
            backwardWorkerJob = null;
            return;
        }

        const messages = await currentTextChannel.messages.fetch({
            limit: 100,
            before: currentTrackedChannel.toMessageId ?? undefined
        });

        if (!messages) {
            return;
        }

        if (messages.size < 100) {
            await updateChannelMessageTracker(prisma, currentTrackedChannel.channelId, undefined, undefined, 1);
        }

        if (messages.size === 0) {
            await updateChannelTracker();
            return;
        }

        for (const message of messages.values()) {
            msg = message
            if (message.author.bot) {
                await updateChannelMessageTracker(prisma, message.channel.id, undefined, message.id);
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
                    await addMessage(prisma, message.id, message.author.id);
                    for (const emoji of match) {
                        const emojiId = uuid();
                        await addEmoji(prisma, emojiId, emoji, message.id);
                        await increaseEmojiCount(prisma, emoji);
                    }
                }
            }

            await updateChannelMessageTracker(prisma, message.channel.id, undefined, message.id);
        }

    }).then(async () => {
        await updateChannelTracker();
    }).catch(() => {
        console.error(msg);
    })
}



