const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed, localesEmbed } = require('../../../embeds/generalEmbeds');
const { validateRange, isValidASIN, getDomainIDByLocale, generateRandomHexColor, validateAvailableLocales } = require('../../../utils/helpers');
const { domain } = require('../../../utils/keepa.json');
const { getAllBrands, brandExists, insertBrand } = require('../../../database/models/asins');
const { isGlobalTrackingEnabled, enableGlobalTracking, disableGlobalTracking, isPolling, unsetIsPolling } = require('../../../database/models/config');
const { initPolling } = require('../../../tracking/polling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-global-tracking')
        .setDescription('Enable or disable global tracking')
        .addBooleanOption(option =>
            option.setName('start-tracking')
                .setDescription('Enable or disable global tracking')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const startTracking = interaction.options.getBoolean('start-tracking');

        const isTrackingEnabled = isGlobalTrackingEnabled();

        if (startTracking === isTrackingEnabled) {
            const errorEmbed = simpleEmbed({
                description: `**Global tracking is already ${startTracking ? 'enabled' : 'disabled'}**\n\n>>> Please use a different option`, color: 'Yellow'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        if (startTracking) {
            if (!isPolling()) {
                initPolling(interaction.client);
            }
            enableGlobalTracking();
        } else {
            disableGlobalTracking();
            unsetIsPolling();
        }

        const successEmbed = simpleEmbed({
            description: `**✅ \u200b Global tracking is now ${startTracking ? 'enabled' : 'disabled'}**`, color: 'Green'
        });
        
        return await interaction.editReply({ embeds: [successEmbed] });
    },
};