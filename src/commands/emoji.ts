
import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { createEmojiStatsMessage } from "../message-formatter";
import { getEmojisCount } from "../db/sqlite";

export const data = new SlashCommandBuilder()
    .setName('emoji')
    .setDescription('check emoji usage for the server'); 


export async function execute(interaction: CommandInteraction) {
    await interaction.deferReply();
        try {
            const emojiCounts = await getEmojisCount();
            const messageOptions = createEmojiStatsMessage(emojiCounts);
            await interaction.editReply(messageOptions);
        } catch (error) {
            console.error('Error fetching emoji stats:', error);
            await interaction.editReply('An error occurred while fetching emoji statistics.');
        }
}