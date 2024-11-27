import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from 'discord.js';
import { ONE_YEAR_AGO, Period } from './constant/time-range';

export function createEmojiCountEmbed(emojiCounts: Map<string, number>, title: string, period?: Period): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription(`Here are statistics of used emojis ${period ? period : 'for all time'}`)
        .setTimestamp()
        .setFooter({ text: 'Emoji Statistics' });

    const sortedEmojis = [...emojiCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    const leastUsedEmojis = [...emojiCounts.entries()]
        .sort((a, b) => a[1] - b[1]) // Sort by count in ascending order
        .slice(0, 20);

    const emojiList = sortedEmojis.map(([name, count], index) => {
        return `${name}- ${count}`;
    }).join('\n');

    // Format the least emojis list
    const leastEmojiList = leastUsedEmojis
        .map(([name, count]) => `${name} - ${count}`)
        .join('\n');

    embed.addFields({ name: 'Top Emojis', value: emojiList || 'No emojis used yet.', inline: true });
    embed.addFields({ name: 'Least Emojis', value: leastEmojiList || 'No emojis used yet.', inline: true });

    return embed;
}

export function createEmojiStatsMessage(emojiCounts: Map<string, number>, period?: Period): MessageCreateOptions {
    const embed = createEmojiCountEmbed(emojiCounts, 'Emoji Usage Statistics', period);

    return {
        embeds: [embed],
    };
}
