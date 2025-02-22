const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setGuildConfig } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-admin')
        .setDescription('Set admin role for the server')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to set as admin')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    // isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const role = interaction.options.getRole('role');
        const roleID = role.id;
        const guildId = interaction.guild.id;

        setGuildConfig(guildId, 'adminRoleID', roleID);

        const embed = simpleEmbed({ footer: "Config", title: 'Admin Role Changed', color: 'Random', }).addFields(
            { name: 'New Admin Role', value: `> <@&${roleID}>` , inline: true },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};