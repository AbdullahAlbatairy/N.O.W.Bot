import { CommandInteraction, DiscordAPIError, Message, SlashCommandBuilder, TextChannel } from 'discord.js'
import { promises } from 'fs'
import { addActiveCommand, isCommandActive, removeActiveCommand } from '../lock-mechanism';
import { config } from '../config';


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
    const commandKey = `${interaction.commandName}-${channel.id}`
    let lastId: string | undefined;
    let attachments = 0;
    let totalProcessed = 0;
    let deletionErrors = 0;


    if (isCommandActive(commandKey, userId)) {
        await interaction.reply({ content: 'This command is already running. Please wait for it to finish.', ephemeral: true });
        return;
    }

    addActiveCommand(commandKey, userId);

    if (userId === config.HUMAN_ID || userId === config.SUBA_ID) {
        await interaction.deferReply({ ephemeral: true });
        const file = await promises.readFile(`/app/data/${userId}-${interaction.channel.id}.txt`, 'utf8').catch(() => {
            return;
        });
        if (file) {
            lastId = file.split(',')[0];
            attachments = Number(file.split(',')[1]);
            totalProcessed = Number(file.split(',')[2]);
            deletionErrors = Number(file.split(',')[3]);
        }
        while (true) {
            try {
                const messages = await channel.messages.fetch({
                    limit: 100,
                    before: lastId
                });


                if (messages.size === 0) {
                    await promises.rm(`/app/data/${userId}-${interaction.channel.id}.txt`, { force: true });
                    break;
                }

                totalProcessed += messages.size;

                let lastMessage: Message | undefined;

                messages.forEach(async (msg) => {
                    if (msg.author.id === config.SUBA_ID) {
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


                if (messages.size < 100) {
                    await promises.rm(`/app/data/${userId}-${interaction.channel.id}.txt`, { force: true });
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
                if (error instanceof DiscordAPIError && error.code === 50027) {
                    await promises.writeFile(`/app/data/${userId}-${interaction.channel.id}.txt`, `${lastId},${attachments},${totalProcessed},${deletionErrors}`);
                    await interaction.user.send(`the token expired while you are trying delete all media in <#${interaction.channel.id}>! run the command again in the same channel to resume the process.`);
                    return
                }


                console.error('Error fetching messages:', error);
                await interaction.editReply('An error occurred while processing messages.');
                return;
            } finally {
                removeActiveCommand(commandKey, userId);
            }
        }

        await interaction.editReply(`Processing complete! Deleted ${attachments} attachments in ${totalProcessed} messages. Error encountered: ${deletionErrors}`);
        await interaction.user.send(`Processing complete in <#${interaction.channel.id}>! Deleted ${attachments} attachments in ${totalProcessed} messages. Error encountered: ${deletionErrors}`);
    } else {
        await interaction.reply('You are not authorized to use this command.');
    }
}
