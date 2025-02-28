const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getConfig, setConfig, deleteConfig, resetConfig } = require('../../../database/models/config');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setGuildConfig, getGuildConfig, isPremiumLocked, lockPremium } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');
const { premiumServerLock } = require('../../../utils/discordUtils');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock-premium')
        .setDescription('Lock the server to premium users only'),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const guild = interaction.guild;
        const guildId = guild.id;

        await interaction.deferReply();

        try {

            const premiumRoleId = getGuildConfig(guildId, 'premium_role_id');

            if (!premiumRoleId) {
                return await interaction.editReply({
                    embeds: [simpleEmbed({ description: '**No premium role set**', color: 'Red' })]
                });
            }

            const premiumRole = interaction.guild.roles.cache.get(premiumRoleId);

            if (!premiumRole) {
                return await interaction.editReply({
                    embeds: [simpleEmbed({ description: '**Premium role not found in the server**', color: 'Red' })]
                });
            }

            // const publicChannel = interaction.guild.channels.cache.get(publicChannelID);

            lockPremium(guildId);

            const serverLock = await premiumServerLock(guild, premiumRoleId);

            if (!serverLock || serverLock.error) {
                return await interaction.editReply({
                    embeds: [simpleEmbed({ description: '**An error occurred. Please try again later**', color: 'Red' })]
                });
            }

            const successEmbed = serverLock.embed;

            return await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            return await interaction.editReply({
                embeds: [simpleEmbed({ description: '**An error occurred. Please try again later**', color: 'Red' })]
            });
        }

    },
};