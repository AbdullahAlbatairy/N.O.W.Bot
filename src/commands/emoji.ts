
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { createEmojiCountStatsMessage } from "../embed-formatter/emoji-count-formatter";
import { getEmojisCount, getEmojisCountForUser } from "../db/sqlite";

export const data = new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('check emoji usage for the server all time!!');

data.addStringOption(option =>
    option.setName('period')
        .setDescription('enter a period to check emoji usage or not to check for all time')
        .setRequired(false)
).addStringOption(option =>
    option.setName('user')
        .setDescription('enter a user to check emoji usage or not to check for all time').setRequired(false)
);

export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    try {

        const periodOption = interaction.options.data.find(option => option.name === 'period');
        const userOption = interaction.options.data.find(option => option.name === 'user');

        const period = periodOption ? Number(periodOption.value) : undefined; 
        const user = userOption?.value as string;

        // Validate period
        if (period !== undefined && (!Number.isInteger(period) || period < 1)) {
            throw new Error('Invalid period format. It must be a positive integer (e.g., 1, 2, 3...).');
        }

        // Validate user
        const userRegex = /^<@\d+>$/;
        if (user !== undefined && !userRegex.test(user)) {
            throw new Error('Invalid user format. It must be in the format of a mention (e,g., @Human).');
        }


        let emojiCounts;
        if (period) emojiCounts = await getEmojisCount(period);
        else if (user) {
            const userId = user.replace('<@', '').replace('>', '');
            emojiCounts = await getEmojisCountForUser(userId);
        }
        else if (user && period) {
            const userId = user.replace('<@', '').replace('>', '');
            emojiCounts = await getEmojisCountForUser(userId, period);
        }
        else emojiCounts = await getEmojisCount();

        const messageOptions = createEmojiCountStatsMessage(emojiCounts, period, user);
        await interaction.editReply(messageOptions);

    } catch (error) {
        console.error('Error fetching emoji stats:', error);
        await interaction.editReply(`Error fetching emoji stats: ${error}`);
    }
}