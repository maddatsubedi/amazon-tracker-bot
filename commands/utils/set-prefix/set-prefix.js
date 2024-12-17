const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-prefix')
        .setDescription('Set the prefix for the bot')
        .addStringOption(option => option.setName('prefix').setDescription('The prefix you want to set').setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        const prefix = interaction.options.getString('prefix');

        setConfig('prefix', prefix);

        const embed = simpleEmbed({footer: "Config", title: 'Prefix changed', color:'Random'}).addFields(
            { name: 'New Prefix', value: `> \`${prefix}\`` },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};