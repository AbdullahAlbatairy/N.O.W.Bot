import { Guild } from 'discord.js';
import { config } from '../config';
import { client } from '../index'
export async function channelsScanner(guild: Guild | undefined) {
    if (!guild) return;
    const channels = await guild.channels.fetch();
    
    const channel = channels.first()



}