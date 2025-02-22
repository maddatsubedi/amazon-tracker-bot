const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setGuildConfig } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-premium-role')
        .setDescription('Set a role as premium role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to be set as premium role')
                .setRequired(true)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const role = interaction.options.getRole('role');
        const roleID = role.id;

        const guildID = interaction.guild.id;

        setGuildConfig(guildID, 'premium_role_id', roleID);

        const embed = simpleEmbed({footer: `${interaction.guild.name} | Config`, title: 'Premium Role Changed', color:'Random'}).addFields(
            { name: 'New Role', value: `> <@&${roleID}>` },
        );

        await interaction.reply({ embeds: [embed] });

    },
};