const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setGuildConfig } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-public-channel')
        .setDescription('Set public channel for the server to be available for non premium users')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to set as public')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const channel = interaction.options.getChannel('channel');
        const channelID = channel.id;
        const guildId = interaction.guild.id;

        await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { ViewChannel: null }).catch((error) => {
            console.error(`[SET_PUBLIC_CHANNEL] : Error setting permissions for channel ${channel.name} in guild ${channel.guild.name}`);
        });

        setGuildConfig(guildId, 'publicChannelID', channelID);

        const embed = simpleEmbed({
            footer: "Config", title: 'Public Channel Changed',
            color: 'Random',
        }).addFields(
            { name: 'New Public Channel', value: `> <#${channelID}>`, inline: true },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};