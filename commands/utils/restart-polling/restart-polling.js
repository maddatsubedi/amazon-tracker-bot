const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed, localesEmbed } = require('../../../embeds/generalEmbeds');
const { validateRange, isValidASIN, getDomainIDByLocale, generateRandomHexColor, validateAvailableLocales } = require('../../../utils/helpers');
const { domain } = require('../../../utils/keepa.json');
const { getAllBrands, brandExists, insertBrand } = require('../../../database/models/asins');
const { isGlobalTrackingEnabled, enableGlobalTracking, disableGlobalTracking, isPolling, unsetIsPolling } = require('../../../database/models/config');
const { initPolling, reInitPolling } = require('../../../tracking/polling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restart-polling')
        .setDescription('Enable or disable global tracking'),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const pollingInit = await reInitPolling(interaction.client);

        console.log("pollingInit", pollingInit);
    },
};