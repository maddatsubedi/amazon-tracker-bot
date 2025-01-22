const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { getAllBrands } = require('../../../database/models/asins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-roles-msg')
        .setDescription('Create Message Embed for Roles')
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description for the message')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the message')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    isAdmin: true,
    async execute(interaction) {
        const description = interaction.options.getString('description');
        const channel = interaction.options.getChannel('channel');

        const rolesEmbed = simpleEmbed({
            description: `**${description}**`,
            color: 'Random',
            footer: 'Button Roles',
        });

        await channel.send({ embeds: [rolesEmbed] });

        const successEmbed = simpleEmbed({
            description: `**Roles message created successfully in <#${channel.id}>**`,
            color: 'Green',
        });

        return await interaction.reply({ embeds: [successEmbed] });
    }
};
