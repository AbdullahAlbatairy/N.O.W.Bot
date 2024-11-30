import { CronJob } from "cron"
import {
    addEmoji,
    addMessage,
    prisma, updateChannelMessageTracker
} from "../db/sqlite";
import { currentBackwardTextChannel, currentBackwardTrackedChannel, currentForwardTextChannel, currentForwardTrackedChannel, updateBackwardChannelTracker, updateForwardChannelTracker } from "./channels-storage";
import { v4 as uuid } from "uuid";
import { discordEmojiRegExp } from "../constant";
import { serverEmojisName } from "../index";

let backwardWorkerJob: CronJob | null = null;
let forwardWorkerJob: CronJob | null = null;
const RIYADH_TIME_ZONE = "Asia/Riyadh"
let msg: any;

export async function setupBackwardWorker() {

    // new CronJob('56 17 * * *', () => {
    console.log(`Starting worker at ${new Date().toISOString()}`);
    backwardWorkerJob = new CronJob('*/4 * * * * *', async () => {
        console.log(`Worker running at ${new Date().toISOString()}`);
        await emojisBackwardScanner()
    }, null, true, RIYADH_TIME_ZONE)

    // }, null, true, RIYADH_TIME_ZONE)


    new CronJob('0 04 * * *', () => {
        if (backwardWorkerJob) {
            backwardWorkerJob.stop();
            backwardWorkerJob = null;
        }
    }, null, true, RIYADH_TIME_ZONE)

    console.log("Worker scheduled to run daily from 12:00 (Riyadh time)");
}

export async function setupForwardWorker() {

    new CronJob('47 17 * * *', () => {
        console.log(`Starting forward worker at ${new Date().toISOString()}`);
        forwardWorkerJob = new CronJob('*/4 * * * * *', async () => {
            console.log(`Worker running at ${new Date().toISOString()}`);
            await emojisForwardScanner()
        }, null, true, RIYADH_TIME_ZONE)

    }, null, true, RIYADH_TIME_ZONE)


    new CronJob('0 22 * * *', () => {
        if (forwardWorkerJob) {
            forwardWorkerJob.stop();
            forwardWorkerJob = null;
        }
    }, null, true, RIYADH_TIME_ZONE)

}


async function emojisBackwardScanner() {
    await prisma.$transaction(async (prisma) => {
        if (!currentBackwardTrackedChannel || !currentBackwardTextChannel) {
            console.log("There is no more channel to scan for emojis. Stopping the worker");
            backwardWorkerJob?.stop();
            backwardWorkerJob = null;
            return;
        }

        let startingPoint;
        if (currentBackwardTrackedChannel.fromMessageId && currentBackwardTrackedChannel.toMessageId)
            startingPoint = currentBackwardTrackedChannel.toMessageId
        else if (currentBackwardTrackedChannel.fromMessageId && !currentBackwardTrackedChannel.toMessageId)
            startingPoint = currentBackwardTrackedChannel.fromMessageId
        else if (!currentBackwardTrackedChannel.fromMessageId && currentBackwardTrackedChannel.toMessageId)
            startingPoint = currentBackwardTrackedChannel.toMessageId
        else
            startingPoint = undefined

        const messages = await currentBackwardTextChannel.messages.fetch({
            limit: 100,
            before: startingPoint
        });

        if (!messages) {
            return;
        }

        if (messages.size < 100) {
            await updateChannelMessageTracker(prisma, true, currentBackwardTrackedChannel.channelId, undefined, undefined, 1);
        }

        if (messages.size === 0) {
            await updateBackwardChannelTracker();
            return;
        }

        for (const message of messages.values()) {
            if (message.author.bot) {
                await updateChannelMessageTracker(prisma, true, message.channel.id, message.id, message.id);
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
                    await addMessage(prisma, message.channel.id, message.id, message.author.id, message.createdTimestamp);
                    for (const emoji of match) {
                        if(!serverEmojisName.some(name => name === emoji)) continue;
                        const emojiId = uuid();
                        await addEmoji(prisma, emojiId, emoji, message.id);
                    }
                }
            }

            await updateChannelMessageTracker(prisma, true, message.channel.id, message.id, message.id);
        }

    }).then(async () => {
        await updateBackwardChannelTracker();
    }).catch(() => {
        console.error(msg);
    })
}


async function emojisForwardScanner() {
    await prisma.$transaction(async (prisma) => {
        if (!currentForwardTrackedChannel || !currentForwardTextChannel) {
            console.log("There is no more channel to scan for emojis. Stopping the worker");
            forwardWorkerJob?.stop();
            forwardWorkerJob = null;
            return;
        }

        if (currentForwardTrackedChannel.fromMessageId) {
            const messages = await currentForwardTextChannel.messages.fetch({
                limit: 100,
                after: currentForwardTrackedChannel.fromMessageId ?? undefined
            });

            if (!messages) {
                await updateForwardChannelTracker();
                return;
            }

            if (messages.size === 0) {
                await updateForwardChannelTracker();
                return;
            }

            if (messages.size < 100) {
                await updateForwardChannelTracker();
            }

            for (const message of messages.values()) {
                msg = message
                if (message.author.bot) {
                    await updateChannelMessageTracker(prisma, false, message.channel.id, message.id);
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
                        await addMessage(prisma, message.channel.id, message.id, message.author.id, message.createdTimestamp);
                        for (const emoji of match) {
                            const emojiId = uuid();
                            await addEmoji(prisma, emojiId, emoji, message.id);
                        }
                    }
                }
                await updateChannelMessageTracker(prisma, false, message.channel.id, message.id);
            }
        }

    }).then(async () => {
        await updateForwardChannelTracker();
    }).catch(() => {
        console.error(msg);
    })


}



