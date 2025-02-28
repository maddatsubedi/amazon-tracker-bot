const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setGuildConfig, getGuildConfig } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-private-channel')
        .setDescription('Add private channel which will not be affected by subscription system')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to add as private')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const channel = interaction.options.getChannel('channel');
        const channelID = channel.id;
        const guildId = interaction.guild.id;

        const previousChannels = getGuildConfig(guildId, 'privateChannels');
        const channelsArray = previousChannels ? previousChannels.split(',') : [];

        if (channelsArray.includes(channelID)) {
            return await interaction.reply({
                embeds: [simpleEmbed({ description: '**Channel already added as private**', color: 'Red' })]
            });
        }

        channelsArray.push(channelID);
        const newChannels = channelsArray.join(',');

        setGuildConfig(guildId, 'privateChannels', newChannels);

        const embed = simpleEmbed({
            footer: "Config", title: 'Private Channel Added',
            color: 'Random',
        }).addFields(
            { name: 'Added Private Channel', value: `> <#${channelID}>`, inline: true },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};