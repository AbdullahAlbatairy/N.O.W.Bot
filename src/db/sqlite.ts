import { Database } from 'sqlite';
import { ChannelMessageTracker, PrismaClient } from '@prisma/client';
import { calculateTimestampForMonthsAgo } from '../utils/period-range';

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

export async function addMessage(prisma: PrismaTransaction, channelId: string,messageId: string, authorId: string, createdAt: number): Promise<void> {
    await prisma.message.create({
        data: {
            messageId,
            channelId,
            authorId,
            createdAt
        }
    }).catch((error) => {
        console.error('Error inserting message:', error);
        return
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
    }).catch((error) => {
        console.error('Error inserting emoji:', error);
        return
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
    }).catch((error) => {
        console.error('Error inserting channel_message_tracker:', error);
        return
    })


    console.log('insert channel_message_tracker is ready');
}

export async function updateChannelMessageTracker(prisma: PrismaTransaction, isBackward: boolean, channelId: string | undefined, fromMessageId?: string, toMessageId?: string, isFinished?: number): Promise<void> {
    const messageId = await prisma.channelMessageTracker.findUnique({
        where: {
            channelId
        },
        select: {
            fromMessageId: true
        }
    })

    if (messageId?.fromMessageId && isBackward) fromMessageId = undefined
    await prisma.channelMessageTracker.update({
        where: {
            channelId
        },
        data: {
            fromMessageId,
            toMessageId,
            isFinished
        }
    }).catch((error) => {
        console.error('Error updating channel_message_tracker:', channelId);
        return
    })
    console.log('channel_message_tracker updated successfully');
}

export async function deleteMessage(prisma: PrismaTransaction, messageId: string): Promise<void> {
    await prisma.message.delete({
        where: {
            messageId
        }
    }).catch((error) => {
        console.error('Error deleting message:', error);
        return
    })

    console.log('delete message is ready');
}


export async function getMessage(messageId: string): Promise<any | undefined> {
    return await prisma.message.findUnique({
        where: {
            messageId
        }
    }).catch((error) => {
        console.error('Error getting message:', error);
        return
    })
}

export async function getAllChannelMessageTrackers(): Promise<any[] | undefined> {
    return await prisma.channelMessageTracker.findMany();
}


export async function getChannelMessageTracker(prisma: PrismaTransaction, channelId: string | undefined): Promise<ChannelMessageTracker | null> {
    return await prisma.channelMessageTracker.findUnique({
        where: {
            channelId
        },
    })
}

export async function getEmojisCount(period?: number): Promise<Map<string, number>> {
    let emojiCounts;

    if (period) {
        emojiCounts = await prisma.emoji.groupBy({
            by: ['name'],
            _count: {
                name: true,
            },
            where: {
                message: {
                    createdAt: {
                        gte: calculateTimestampForMonthsAgo(period),
                    },
                },
            },
        });
    }
    else {
        emojiCounts = await prisma.emoji.groupBy({
            by: ['name'], // Group by emoji name
            _count: {
                name: true, // Count occurrences of each emoji name
            },
        });

    }

    // Convert the result into a Map
    const emojiCountMap = new Map<string, number>();
    for (const emoji of emojiCounts) {
        emojiCountMap.set(emoji.name, emoji._count.name);
    }

    return emojiCountMap;
}


export async function getEmojisCountForUser(userId: string, period?: number): Promise<Map<string, number>> {
    let emojiCounts;

    if (period) {
        emojiCounts = await prisma.emoji.groupBy({
            by: ['name'],
            _count: {
                name: true,
            },
            where: {
                message: {
                    authorId: userId,
                    createdAt: {
                        gte: calculateTimestampForMonthsAgo(period),
                    },
                },
            },
        });
    }
    emojiCounts = await prisma.emoji.groupBy({
        by: ['name'],
        _count: {
            name: true,
        },
        where: {
            message: {
                authorId: userId,
            },
        },
    });

    // Convert the result into a Map
    const emojiCountMap = new Map<string, number>();
    for (const emoji of emojiCounts) {
        emojiCountMap.set(emoji.name, emoji._count.name);
    }

    return emojiCountMap;
}