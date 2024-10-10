import sqlite from 'sqlite3';
import { open, Database } from 'sqlite';

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

    await db.exec(`CREATE TABLE IF NOT EXISTS messages (
        message_id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL
    )`);
    console.log('Created messages table');

    await db.exec(`CREATE TABLE IF NOT EXISTS emojis (
        emoji_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        message_id TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(message_id) 
        ON DELETE CASCADE
    )`);
    console.log('Created emojis table');

    await db.exec(`CREATE TABLE IF NOT EXISTS emoji_counts (
        name TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 1
    )`);
    console.log('Created emoji_counts table');

    await db.exec(`CREATE TABLE IF NOT EXISTS channel_message_tracker (
        channel_id TEXT PRIMARY KEY,
        first_message_id TEXT NOT NULL,
        last_message_id TEXT NOT NULL
    )`);

    console.log('Created channel_message_tracker table');


}

export async function beginTransaction(): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.exec('BEGIN TRANSACTION');
    console.log('Began transaction');
}


export async function commit(): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.exec('COMMIT');
    console.log('Committed changes');
}

export async function addMessage(messageId: string, authorId: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.run('INSERT OR REPLACE INTO messages (message_id, author_id) VALUES (?, ?)', [messageId, authorId]);
    console.log('insert message is ready');
}

export async function addEmoji(emojiId: string, name: string, messageId: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.run('INSERT OR REPLACE INTO emojis (emoji_id, name, message_id) VALUES (?, ?, ?)', [emojiId, name, messageId]);
    console.log('insert emoji is ready');
}

export async function increaseEmojiCount(emojiName: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.run(`
        INSERT INTO emoji_counts (name, count) 
        VALUES (?, 1) 
        ON CONFLICT(name) DO UPDATE SET count = count + 1
    `, [emojiName]);
    console.log('update emoji count is ready');
}

export async function deleteMessage(messageId: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.run('DELETE FROM messages WHERE message_id = ?', [messageId]);
    console.log('delete message is ready');
}

export async function reduceEmojiCount(emojiName: string): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.run('UPDATE emoji_counts SET count = count - 1 WHERE name = ?', [emojiName]);
    console.log('reduce emoji count is ready');
}


export async function getAllMessages(): Promise<any[]> {
    if (!db) throw new Error('Database not connected');
    const rows = await db.all('SELECT * FROM messages');
    return rows;
}


export async function getAllEmojis(): Promise<any[]> {
    if (!db) throw new Error('Database not connected');
    const rows = await db.all('SELECT * FROM emojis');
    return rows;
}

export async function getAllMessageEmojis(): Promise<any[]> {
    if (!db) throw new Error('Database not connected');
    const rows = await db.all('SELECT * FROM message_emojis');
    return rows
}

export async function getEmojisCount(): Promise<Map<string, number>> {
    if (!db) throw new Error('Database not connected');

    const emojiCounts = new Map<string, number>();

    const rows = await db.all('SELECT name, count FROM emoji_counts');

    for (const row of rows) {
        emojiCounts.set(row.name, row.count);
    }

    return emojiCounts;
}


export async function rollback(): Promise<void> {
    if (!db) throw new Error('Database not connected');
    await db.exec('ROLLBACK');
    console.log('Rolled back changes');
}


export async function close(): Promise<void> {
    if (db) {
        await db.close();
        db = null;
    }
}


