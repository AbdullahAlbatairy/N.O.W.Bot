import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from 'discord.js';

export function createEmojiCountEmbed(emojiCounts: Map<string, number>, title: string, period?: number, user?: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription(`Here are statistics of used emojis for ${period ? period + " month(s)" : 'all time'} for ${user ? user : 'all users'}`)
        .setTimestamp()
        .setFooter({ text: 'Emoji Statistics' });

    const sortedEmojis = [...emojiCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    const leastUsedEmojis = [...emojiCounts.entries()]
        .sort((a, b) => a[1] - b[1]) 
        .slice(0, 20);

    const emojiList = sortedEmojis.map(([name, count], index) => {
        return `${name}- ${count}`;
    }).join('\n');

    const leastEmojiList = leastUsedEmojis
        .map(([name, count]) => `${name} - ${count}`)
        .join('\n');

    embed.addFields({ name: 'Top Emojis', value: emojiList || 'No emojis used yet.', inline: true });
    embed.addFields({ name: 'Least Emojis', value: leastEmojiList || 'No emojis used yet.', inline: true });

    return embed;
}

export function createEmojiCountStatsMessage(emojiCounts: Map<string, number>, period?: number, user?: string): MessageCreateOptions {
    const embed = createEmojiCountEmbed(emojiCounts, 'Emoji Usage Statistics', period, user);
    return {
        embeds: [embed],
    };
}
