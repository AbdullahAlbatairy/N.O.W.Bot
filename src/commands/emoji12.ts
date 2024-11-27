
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { getEmojisCount } from "../db/sqlite";
import { createEmojiStatsMessage } from "../message-formatter";
import { ONE_YEAR_AGO, Period } from "../constant/time-range";

export const data = new SlashCommandBuilder()
    .setName('emoji12')
    .setDescription('check emoji usage for the server for the last year');


export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    try {
        const emojiCounts = await getEmojisCount(ONE_YEAR_AGO);
        const messageOptions = createEmojiStatsMessage(emojiCounts, Period.ONE_YEAR_AGO);
        await interaction.editReply(messageOptions);
    } catch (error) {
        console.error('Error fetching emoji stats:', error);
        await interaction.editReply('An error occurred while fetching emoji statistics.');
    }
}