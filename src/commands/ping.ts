import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('check if the bot is online');


export async function execute(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
}