import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageCreateOptions } from 'discord.js';

export function createEmojiCountEmbed(emojiCounts: Map<string, number>, title: string): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription('Here are the most used emojis:')
        .setTimestamp()
        .setFooter({ text: 'Emoji Statistics' });

    const sortedEmojis = [...emojiCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);

        const emojiList = sortedEmojis.map(([name, count], index) => {
            return `${name}- ${count}`;
        }).join('\n');

        embed.addFields({ name: 'Top Emojis', value: emojiList || 'No emojis used yet.' });

    return embed;
}

export function createEmojiStatsMessage(emojiCounts: Map<string, number>): MessageCreateOptions {
    const embed = createEmojiCountEmbed(emojiCounts, 'Emoji Usage Statistics');

    return {
        embeds: [embed],
    };
}