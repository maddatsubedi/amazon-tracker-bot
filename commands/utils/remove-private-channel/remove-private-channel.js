const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setGuildConfig, getGuildConfig } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-private-channel')
        .setDescription('Remove private channel for the server which will be affected by subscription system')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to remove as private')
                .setRequired(true)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const channel = interaction.options.getChannel('channel');
        const channelID = channel.id;
        const guildId = interaction.guild.id;

        const previousChannels = getGuildConfig(guildId, 'privateChannels');
        const channelsArray = previousChannels ? previousChannels.split(',') : [];

        if (!channelsArray.includes(channelID)) {
            return await interaction.reply({
                embeds: [simpleEmbed({ description: '**Channel not added as private**', color: 'Red' })]
            });
        }

        const index = channelsArray.indexOf(channelID);
        channelsArray.splice(index, 1);
        const newChannels = channelsArray.join(',');

        setGuildConfig(guildId, 'privateChannels', newChannels);

        const embed = simpleEmbed({
            footer: "Config", title: 'Private Channel Removed',
            color: 'Random',
        }).addFields(
            { name: 'Removed Private Channel', value: `> <#${channelID}>`, inline: true },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};