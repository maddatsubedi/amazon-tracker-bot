const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed, localesEmbed } = require('../../../embeds/generalEmbeds');
const { validateRange, isValidASIN, getDomainIDByLocale, generateRandomHexColor, validateAvailableLocales } = require('../../../utils/helpers');
const { domain } = require('../../../utils/keepa.json');
const { getAllBrands, brandExists, insertBrand, getAllTrackedBrands } = require('../../../database/models/asins');
const { isPolling } = require('../../../database/models/config');
const { initPolling, reInitPolling } = require('../../../tracking/polling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-brand')
        .setDescription('Add a new brand to the database')
        .addStringOption(option =>
            option.setName('brand')
                .setDescription('Brand name to add products of')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('domains')
                .setDescription('Domains (comma separated) to add products of (use `all` for all domains)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send notifications to')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addBooleanOption(option =>
            option.setName('start-tracking')
                .setDescription('Start tracking the brand')
                .setRequired(false)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const brand = interaction.options.getString('brand');
        const domains = interaction.options.getString('domains').toLowerCase().split(',').map(domain => domain.trim());
        const isAllDomain = domains.includes('all') && domains.length === 1;
        const startTracking = interaction.options.getBoolean('start-tracking');
        const channel = interaction.options.getChannel('channel');

        const isBrandExist = await brandExists(brand);

        if (isBrandExist) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The brand already exists**\n\n>>> Please use a different brand name`, color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        if (domains.includes('all') && domains.length > 1) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The domains are not valid**\n\n>>> Do not include other domains with \`all\``, color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        if (!isAllDomain) {
            const validateDomains = validateAvailableLocales(domains);
            const invalidLocales = validateDomains.invalidLocales;
            const duplicateLocales = validateDomains.duplicateLocales;

            const invalidLocalesString = invalidLocales.map(locale => `\`${locale}\``).join(`\n`);
            const duplicateLocalesString = duplicateLocales.map(locale => `\`${locale}\``).join(`\n`);

            const errorString = `**❌ \u200b The domains are not valid**\n\n`;

            let errorDescription = '';

            if (invalidLocales.length > 0) {
                errorDescription += `**Invalid domains:**\n${invalidLocalesString}\n\n`;
            }

            if (duplicateLocales.length > 0) {
                errorDescription += `**Duplicate domains:**\n${duplicateLocalesString}\n\n`;
            }

            if (!validateDomains.isValid) {
                const errorEmbed = simpleEmbed({
                    description: `${errorString}${errorDescription}`, color: 'Red'
                });

                const locales_Embed = localesEmbed();
                return await interaction.editReply({ embeds: [errorEmbed, locales_Embed] });
            }
        }

        // console.log(brand.length);
        // console.log(domains);
        const domainsString = isAllDomain ? 'all' : domains.join(',');

        await insertBrand(brand, domainsString, startTracking, channel.id);

        const trackingBrands = getAllTrackedBrands();

        if (trackingBrands.length !== 0) {
            reInitPolling(interaction.client);
        }

        const successEmbed = simpleEmbed({
            description: `**✅ \u200b The brand has been added successfully**\n\n> **Brand**: \`${brand}\`\n> **New Domains**: \`${domainsString}\``,
            color: 'Green'
        });

        return await interaction.editReply({ embeds: [successEmbed] });
    },
};