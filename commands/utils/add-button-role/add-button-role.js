const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { getAllBrands } = require('../../../database/models/asins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-button-role')
        .setDescription('Add Button Role to the message')
        .addStringOption(option =>
            option.setName('message_link')
                .setDescription('Message link to add the button role')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to add')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        try {

            await interaction.deferReply();

            const messageLink = interaction.options.getString('message_link');
            const role = interaction.options.getRole('role');

            const validLinkRegex = /^https:\/\/(?:www\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
            const match = messageLink.match(validLinkRegex);

            if (!match) {
                const errorEmbed = simpleEmbed({
                    description: `**Invalid message link format**`,
                    color: 'Red',
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const [_, linkGuildId, channelId, messageId] = match;

            if (linkGuildId !== interaction.guildId) {
                const errorEmbed = simpleEmbed({
                    description: `**Message link must be from this server**`,
                    color: 'Red',
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
            if (!channel || channel.type !== ChannelType.GuildText) {
                const errorEmbed = simpleEmbed({
                    description: `**Invalid text channel in message link**`,
                    color: 'Red',
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const message = await channel.messages.fetch(messageId).catch(() => null);
            if (!message) {
                const errorEmbed = simpleEmbed({
                    description: `**Message not found in <#${channel.id}>**`,
                    color: 'Red',
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

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

            const roleExists = message.components.some(row => row.components.some(button => button.customId === `button_role:${role.id}`));

            if (roleExists) {
                const errorEmbed = simpleEmbed({
                    description: `**Role already exists in the message**`,
                    color: 'Red',
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const button = new ButtonBuilder()
                .setCustomId(`button_role:${role.id}`)
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
