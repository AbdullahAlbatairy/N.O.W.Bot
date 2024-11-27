
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { getEmojisCount } from "../db/sqlite";
import { createEmojiStatsMessage } from "../message-formatter";
import { Period, THREE_MONTHS_AGO } from "../constant/time-range";

export const data = new SlashCommandBuilder()
    .setName('emoji3')
    .setDescription('check emoji usage for the server for the last 3 months');


export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();
    try {
        const emojiCounts = await getEmojisCount(THREE_MONTHS_AGO);
        const messageOptions = createEmojiStatsMessage(emojiCounts, Period.THREE_MONTHS_AGO);
        await interaction.editReply(messageOptions);
    } catch (error) {
        console.error('Error fetching emoji stats:', error);
        await interaction.editReply('An error occurred while fetching emoji statistics.');
    }
}