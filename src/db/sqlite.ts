import sqlite from 'sqlite3';
import { Database, open } from 'sqlite';
import { tableNames } from "../constant";
import { PrismaClient } from '@prisma/client';

let db: Database | null = null;
export let prisma: PrismaClient;

type PrismaTransaction = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export async function connect(): Promise<void> {
    prisma = new PrismaClient()
    await prisma.$connect()
    console.log('Connected to SQLite database');

}

export async function commit(): Promise<void> {
    await db?.exec('COMMIT');
    console.log('Committed changes');
}

export async function addMessage(prisma: PrismaTransaction, messageId: string, authorId: string): Promise<void> {
    await prisma.message.create({
        data: {
            messageId,
            authorId
        }
    })
    console.log('insert message is ready');
}

export async function addEmoji(prisma: PrismaTransaction, emojiId: string, name: string, messageId: string): Promise<void> {
    await prisma.emoji.create({
        data: {
            emojiId,
            name,
            messageId
        }
    })

    console.log('insert emoji is ready');

}

export async function addChannelMessageTracker(prisma: PrismaTransaction, channelId: string | undefined, fromMessageId?: string, toMessageId?: string, isFinished?: number): Promise<void> {
    if (!channelId) return
    await prisma.channelMessageTracker.upsert({
        where: {
            channelId
        },
        update: {
            fromMessageId,
            toMessageId,
            isFinished
        },
        create: {
            channelId,
            fromMessageId,
            toMessageId,
            isFinished
        }
    })


    console.log('insert channel_message_tracker is ready');
}

export async function updateChannelMessageTracker(prisma: PrismaTransaction, channelId: string | undefined, fromMessageId?: string, toMessageId?: string, isFinished?: number): Promise<void> {
    if (!channelId) return;
    await prisma.channelMessageTracker.update({
        where: {
            channelId
        },
        data: {
            fromMessageId,
            toMessageId,
            isFinished
        }
    })
    console.log('channel_message_tracker updated successfully');
}

export async function increaseEmojiCount(prisma: PrismaTransaction, emojiName: string): Promise<void> {
    await prisma.emojiCount.upsert({
        where: {
            name: emojiName
        },
        update: {
            count: {
                increment: 1
            }
        },
        create: {
            name: emojiName,
            count: 1
        }
    })


    console.log('update emoji count is ready');
}

export async function deleteMessage(prisma: PrismaTransaction, messageId: string): Promise<void> {
    await prisma.message.delete({
        where: {
            messageId
        }
    })
    console.log('delete message is ready');
}

export async function reduceEmojiCount(prisma: PrismaTransaction, emojiName: string): Promise<void> {
    await prisma.emojiCount.update({
        where: {
            name: emojiName
        },
        data: {
            count: {
                decrement: 1
            }
        }
    })
    await prisma.emojiCount.deleteMany({
        where: {
            name: emojiName,
            count: {
                lte: 0
            }
        }
    })

    console.log('reduce emoji count is ready');
}

export async function getMessage(messageId: string): Promise<any | undefined> {
    return await prisma.message.findUnique({
        where: {
            messageId
        }
    })
}

export async function getAllMessages(): Promise<any[] | undefined> {
    return await prisma.message.findMany();
}


export async function getAllEmojis(): Promise<any[] | undefined> {
    return await prisma.emoji.findMany();
}

export async function getAllEmojisCount() {
    return db?.all(`SELECT * FROM ${tableNames.emoji_count}`);
}

export async function getAllChannelMessageTrackers(): Promise<any[] | undefined> {
    return await prisma.channelMessageTracker.findMany();
}

export async function getEmojisCount(): Promise<Map<string, number>> {
    const rows = await prisma.emojiCount.findMany();

    const emojiCounts = new Map<string, number>();

    for (const row of rows) {
        emojiCounts.set(row.name, row.count);
    }

    return emojiCounts;
}

export async function getLeastUsedEmoji(): Promise<Map<string, number>> {
    const rows = await prisma.emojiCount.findMany(
        {
            orderBy: {
                count: 'asc'
            },
            select: {
                name: true,
                count: true
            }
        }
    );

    const leastUsedEmoji = new Map<string, number>();

    for (const row of rows) {
        leastUsedEmoji.set(row.name, row.count);
    }

    return leastUsedEmoji;
}