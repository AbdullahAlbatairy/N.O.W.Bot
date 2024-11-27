import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { getEmojisCount } from "../db/sqlite";
import { createEmojiStatsMessage } from "../message-formatter";
import { Period, THIRTY_DAYS_AGO } from "../constant/time-range";

export const data = new SlashCommandBuilder()
    .setName('emoji1')
    .setDescription('check emoji usage for the server for 30 days');


export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    try {
        const emojiCounts = await getEmojisCount(THIRTY_DAYS_AGO);
        const messageOptions = createEmojiStatsMessage(emojiCounts, Period.THIRTY_DAYS_AGO);
        await interaction.editReply(messageOptions);
    } catch (error) {
        console.error('Error fetching emoji stats:', error);
        await interaction.editReply('An error occurred while fetching emoji statistics.');
    }
}