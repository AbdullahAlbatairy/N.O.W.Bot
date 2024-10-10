
import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('emojiStatus')
    .setDescription('check emoji status for the server'); 


export async function execute(interaction: CommandInteraction) {
    
}