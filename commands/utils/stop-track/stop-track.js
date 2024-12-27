const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed, localesEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getChannelAndRole } = require('../../../database/models/discount_range');
const { validateRange, isValidASIN, getDomainIDByLocale, generateRandomHexColor, validateAvailableLocales } = require('../../../utils/helpers');
const { domain } = require('../../../utils/keepa.json');
const { getProductDetails, getProductGraphBuffer } = require('../../../utils/keepaApis');
const { getAllBrands, brandExists, insertBrand, setTrackingForBrand } = require('../../../database/models/asins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop-track')
        .setDescription('Stop tracking the brand')
        .addStringOption(option =>
            option.setName('brand')
                .setDescription('Brand name to stop tracking')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const brand = interaction.options.getString('brand');

        const isBrandExist = await brandExists(brand);

        if (!isBrandExist) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The brand doesn't exists**\n\n>>> Please use \`add-brand\` to add brand first`, color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        await setTrackingForBrand(brand, false);

        const successEmbed = simpleEmbed({
            description: `**✅ \u200b The brand has been unset for tracking**\n\n> **Brand**: \`${brand}\`\n> **Status**: \`Not-Tracking\``,
            color: 'Green'
        });

        return await interaction.editReply({ embeds: [successEmbed] });
    },
};