import dotenv from 'dotenv';

dotenv.config();

const { APP_ID, DISCORD_TOKEN, PUBLIC_KEY, SERVER_ID, SUBA_ID, HUMAN_ID } = process.env;

if (!APP_ID || !DISCORD_TOKEN || !PUBLIC_KEY || !SERVER_ID || !SUBA_ID || !HUMAN_ID) {
    throw new Error('Missing required environment variables');
}

export const config =  { APP_ID, DISCORD_TOKEN, PUBLIC_KEY, SERVER_ID, SUBA_ID, HUMAN_ID };