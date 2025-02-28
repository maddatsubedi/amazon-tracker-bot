const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setGuildConfig, getGuildConfig } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');
const { safeField } = require('../../../utils/discordUtils');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-private-channels')
        .setDescription('List all private channels added to the server'),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const guildId = interaction.guild.id;

        const previousChannels = getGuildConfig(guildId, 'privateChannels');
        const channelsArray = previousChannels ? previousChannels.split(',') : [];

        if (!channelsArray.length) {
            return await interaction.reply({
                embeds: [simpleEmbed({ description: '**No private channels added**', color: 'Red' })]
            });
        }

        const channelsList = channelsArray.map(channel => `<#${channel}>`).join(', ');

        const embed = simpleEmbed({
            footer: `${interaction.guild.name} | Private Channels`, title: 'Private Channels List',
            color: 'Random',
            description: "> Following are the private channels added to the server which will not be affected by subscription system",
        }).addFields(
            { name: "Private Channels", value: safeField(channelsList) },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};