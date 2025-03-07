const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setGuildConfig, deleteGuildConfig, getGuildConfig, isPremiumLocked } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unset-public-channel')
        .setDescription('Unset public channel for the server to be available for non premium users'),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const guildId = interaction.guild.id;

        const previousChannelID = getGuildConfig(guildId, 'publicChannelID');
        if (!previousChannelID) {
            return await interaction.reply({
                embeds: [simpleEmbed({ description: '**No public channel set**', color: 'Red' })]
            });
        }

        const channel = interaction.guild.channels.cache.get(previousChannelID);

        const isLocked = isPremiumLocked(guildId);

        const viewChannelPerm = isLocked ?
            { ViewChannel: false } :
            { ViewChannel: null };

        if (channel) {
            await channel.permissionOverwrites?.edit(channel.guild.roles.everyone, viewChannelPerm).catch((error) => {
                console.error(`[UNSET_PUBLIC_CHANNEL] : Error setting permissions for channel ${channel.name} in guild ${channel.guild.name}`);
            });
        }

        deleteGuildConfig(guildId, 'publicChannelID');

        const embed = simpleEmbed({
            footer: "Config",
            title: 'Public Channel Unset',
            color: 'Random',
        }).addFields(
            {
                name: 'Public Channel Before', value: `> <#${previousChannelID}>`, inline: true
            },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};