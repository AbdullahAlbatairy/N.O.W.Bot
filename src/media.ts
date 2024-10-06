import { Collection, CommandInteraction, DiscordAPIError, Message, SlashCommandBuilder, TextChannel } from 'discord.js'

export const data = new SlashCommandBuilder()
    .setName('media')
    .setDescription('Allow user to remove media')

export async function execute(interaction: CommandInteraction) {
    if (!(interaction.channel instanceof TextChannel)) {
        await interaction.reply('This command can only be used in text channels.');
        return;
    }


    const channel = interaction.channel;
    const userId = interaction.user.id;
    let lastId: string | undefined;
    let attachments = 0;
    let totalProcessed = 0;
    let deletionErrors = 0;



    if (userId === '352190104540020737') {
        await interaction.deferReply({ ephemeral: true });
        while (true) {
            try {
                const messages = await channel.messages.fetch({
                    limit: 100,
                    before: lastId
                });


                if (messages.size === 0) break;

                totalProcessed += messages.size;

                let lastMessage: Message | undefined;

                messages.forEach(async (msg) => {
                    if (msg.author.id === "744006301738336267") {
                        const hasMediaAttachment = msg.attachments.some((a) =>
                            a.contentType?.includes('image') || a.contentType?.includes('video'));
                        if (hasMediaAttachment) {

                            try {
                                await msg.delete();
                                attachments++;
                                console.log(`Deleted message ${msg.id}`);
                            } catch (error) {
                                if (error instanceof DiscordAPIError && error.code === 10008) {
                                    console.log(`Message ${msg.id} already deleted or not found.`);
                                    deletionErrors++;
                                } else {
                                    console.error(`Error deleting message ${msg.id}:`, error);
                                    deletionErrors++;
                                } 
                            }
                        } else {
                            lastMessage = msg;
                        }
                    } else {
                        lastMessage = msg;
                    }
                });

                lastId = lastMessage?.id;

                if (totalProcessed % 1000 === 0) {
                    await interaction.editReply(`Processing... ${totalProcessed} messages scanned, ${attachments} attachments deleted.`);
                }


                if (messages.size < 100) break;

                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                console.error('Error fetching messages:', error);
                await interaction.editReply('An error occurred while processing messages.');
                return;
            }
        }

        await interaction.editReply(`Processing complete! Deleted ${attachments} attachments in ${totalProcessed} messages. Error encountered: ${deletionErrors}`);
    } else {
        await interaction.reply('You are not authorized to use this command.');
    }
}