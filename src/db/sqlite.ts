import sqlite from 'sqlite3';
import {Database, open} from 'sqlite';
import {tableNames} from "../constant";

let db: Database | null = null;

export async function connect(filename: string): Promise<void> {
    db = await open({
        filename: filename,
        driver: sqlite.Database
    });

    if (!db) {
        throw new Error('Failed to connect to SQLite database');
    }

    console.log('Connected to SQLite database');

}

export async function createTable(): Promise<void> {
    if (!db) {
        throw new Error('Database not connected');
    }

    await db.run('PRAGMA foreign_keys = ON');

    await db.exec(`CREATE TABLE IF NOT EXISTS ${tableNames.messages} (
        message_id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL
    )`);
    console.log('Created messages table');

    await db.exec(`CREATE TABLE IF NOT EXISTS ${tableNames.emoji} (
        emoji_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        message_id TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES ${tableNames.messages}(message_id) 
        ON DELETE CASCADE
    )`);
    console.log('Created emojis table');

    await db.exec(`CREATE TABLE IF NOT EXISTS ${tableNames.emoji_count} (
        name TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1
    )`);
    console.log('Created emoji_counts table');

    await db.exec(`CREATE TABLE IF NOT EXISTS ${tableNames.channel_message_tracker} (
        channel_id TEXT PRIMARY KEY,
        from_message_id TEXT,
        to_message_id TEXT,
        is_finished INTEGER NOT NULL DEFAULT 0 CHECK (is_finished IN(0,1))  
    )`);
    console.log('Created channel_message_tracker table');
}

export async function beginTransaction(): Promise<void> {
    await db?.exec('BEGIN TRANSACTION');
    console.log('Began transaction');
}


export async function commit(): Promise<void> {
    await db?.exec('COMMIT');
    console.log('Committed changes');
}

export async function addMessage(messageId: string, authorId: string | undefined): Promise<void> {
    await db?.run(`INSERT OR REPLACE INTO ${tableNames.messages}(message_id, author_id) VALUES (?, ?)`, [messageId, authorId]);
    console.log('insert message is ready');
}

export async function addEmoji(emojiId: string, name: string, messageId: string): Promise<void> {
    await db?.run(`INSERT OR REPLACE INTO ${tableNames.emoji}(emoji_id, name, message_id) VALUES (?, ?, ?)`, [emojiId, name, messageId]);
    console.log('insert emoji is ready');
}

export async function addChannelMessageTracker(channelId: string | undefined, fromMessageId?: string, toMessageId?: string, isFinished?: number): Promise<void> {
    if(!channelId) return
    await db?.run(`INSERT OR REPLACE INTO ${tableNames.channel_message_tracker}(channel_id, from_message_id, to_message_id, is_finished) VALUES (?, ?, ?,?)`, [channelId, fromMessageId, toMessageId, isFinished]);
    console.log('insert channel_message_tracker is ready');
}

export async function updateChannelMessageTracker(channelId: string | undefined, fromMessageId?: string, toMessageId?: string, isFinished?: number): Promise<void> {
    if (!channelId) return;

    let query = `UPDATE ${tableNames.channel_message_tracker} SET `;
    const params: (string | number | undefined)[] = [];
    const updateFields: string[] = [];

    if (fromMessageId) {
        updateFields.push('from_message_id = ?');
        params.push(fromMessageId);
    }

    if (toMessageId) {
        updateFields.push('to_message_id = ?');
        params.push(toMessageId);
    }

    if (isFinished) {
        updateFields.push('is_finished = ?');
        params.push(isFinished);
    }

    if (updateFields.length === 0) {
        console.log('No fields to update');
        return;
    }

    query += updateFields.join(', ');
    query += ' WHERE channel_id = ?';
    params.push(channelId);

    try {
        await db?.run(query, params);
        console.log('channel_message_tracker updated successfully');
    } catch (error) {
        console.error('Error updating channel_message_tracker:', error);
        throw error;
    }

}

export async function increaseEmojiCount(emojiName: string): Promise<void> {
    await db?.run(`
        INSERT INTO ${tableNames.emoji_count} (name, count) 
        VALUES (?, 1) 
        ON CONFLICT(name) DO UPDATE SET count = count + 1
    `, [emojiName]);
    console.log('update emoji count is ready');
}

export async function deleteMessage(messageId: string): Promise<void> {
    await db?.run(`DELETE FROM ${tableNames.messages} WHERE message_id = ?`, [messageId]);
    console.log('delete message is ready');
}

export async function reduceEmojiCount(emojiName: string): Promise<void> {
    await db?.run(`UPDATE ${tableNames.emoji_count} SET count = count - 1 WHERE name = ?`, [emojiName]);
    await db?.run(`DELETE FROM ${tableNames.emoji_count} WHERE name = ? AND count <= 0`, [emojiName]);
    console.log('reduce emoji count is ready');
}

export async function getMessage(messageId: string): Promise<any | undefined> {
    return db?.get(`SELECT * FROM ${tableNames.messages} WHERE message_id = ?`, [messageId]);
}

export async function getAllMessages(): Promise<any[] | undefined> {
    return db?.all(`SELECT * FROM ${tableNames.messages}`);
}


export async function getAllEmojis(): Promise<any[] | undefined> {
    return db?.all(`SELECT * FROM ${tableNames.emoji}`);
}

export async function getAllMessageEmojis(): Promise<any[] | undefined> {
    return db?.all(`SELECT * FROM message_emojis`);
}

export async function getAllEmojisCount() {
    return db?.all(`SELECT * FROM ${tableNames.emoji_count}`);
}

export async function getAllChannelMessageTrackers(): Promise<ChannelMessageTracker[] | undefined> {
    return db?.all(`SELECT * FROM ${tableNames.channel_message_tracker}`);
}

export async function getEmojisCount(): Promise<Map<string, number>> {
    if (!db) throw new Error('Database not connected');

    const rows = await db.all(`SELECT name, count FROM ${tableNames.emoji_count}`);

    const emojiCounts = new Map<string, number>();

    for (const row of rows) {
        emojiCounts.set(row.name, row.count);
    }

    return emojiCounts;
}

export async function getLeastUsedEmoji(): Promise<Map<string, number>> {
    if (!db) throw new Error('Database not connected');

    const rows = await db.all(`
        SELECT name, count 
        FROM ${tableNames.emoji_count} 
        ORDER BY count ASC 
    `);

    const leastUsedEmoji = new Map<string, number>();

    for (const row of rows) {
        leastUsedEmoji.set(row.name, row.count);
    }

    return leastUsedEmoji;
}


export async function rollback(): Promise<void> {
    await db?.exec('ROLLBACK');
    console.log('Rolled back changes');
}


export async function close(): Promise<void> {
    if (db) {
        await db.close();
        db = null;
    }
}