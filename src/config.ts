import dotenv from 'dotenv';

dotenv.config();

const { APP_ID, DISCORD_TOKEN, PUBLIC_KEY } = process.env;

if (!APP_ID || !DISCORD_TOKEN || !PUBLIC_KEY) {
    throw new Error('Missing required environment variables');
}

export const config =  { APP_ID, DISCORD_TOKEN, PUBLIC_KEY };