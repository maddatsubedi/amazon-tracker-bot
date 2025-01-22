const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { getAllBrands } = require('../../../database/models/asins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-button-role')
        .setDescription('Add Button Role to the message')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('Message ID to add the button role')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to add')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel where the message is')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    isAdmin: true,
    async execute(interaction) {

        try {

            await interaction.deferReply();

            const messageID = interaction.options.getString('message_id');
            const role = interaction.options.getRole('role');
            const channel = interaction.options.getChannel('channel');

            const message = await channel.messages.fetch(messageID).catch(() => {
                return null;
            });

            if (!message) {
                const errorEmbed = simpleEmbed({
                    description: `**Message not found in <#${channel.id}>**`,
                    color: 'Red',
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (message.author.id !== interaction.client.user.id) {
                const errorEmbed = simpleEmbed({
                    description: `**Message is not sent by the bot**`,
                    color: 'Red',
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (message.embeds?.length !== 1 || message.embeds?.[0]?.footer?.text !== 'Button Roles') {
                const errorEmbed = simpleEmbed({
                    description: `**Message is not a Button Roles message**`,
                    color: 'Red',
                });
                return await interaction.reply({ embeds: [errorEmbed] });
            }

            const roleExists = message.components.some(row => row.components.some(button => button.customId === `button_role_${role.id}`));

            if (roleExists) {
                const errorEmbed = simpleEmbed({
                    description: `**Role already exists in the message**`,
                    color: 'Red',
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const button = new ButtonBuilder()
                .setCustomId(`button_role_${role.id}`)
                .setLabel(role.name)
                .setStyle(ButtonStyle.Primary)

            const actionRow = new ActionRowBuilder()
                .addComponents(button);

            let flag = false;
            if (message.components.length > 0) {
                if (message.components[message.components.length - 1].components.length < 5) {
                    message.components[message.components.length - 1].components.push(button);
                    flag = true;
                }
            }

            if (!flag) {
                message.components.push(actionRow);
            }

            await message.edit({ components: message.components });

            const successEmbed = simpleEmbed({
                description: `**Button Role added to the message**`,
                color: 'Green',
            });

            return await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.log(error);
            const errorEmbed = simpleEmbed({
                description: `**An error occurred**`,
                color: 'Red',
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
