const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed, localesEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getChannelAndRole } = require('../../../database/models/discount_range');
const { validateRange, isValidASIN, getDomainIDByLocale, generateRandomHexColor, validateAvailableLocales } = require('../../../utils/helpers');
const { domain } = require('../../../utils/keepa.json');
const { getProductDetails, getProductGraphBuffer } = require('../../../utils/keepaApis');
const { getAllBrands, brandExists } = require('../../../database/models/asins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-products')
        .setDescription('Add products to the database')
        .addStringOption(option =>
            option.setName('brand')
                .setDescription('Brand name to add products of')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('domains')
                .setDescription('Domains (comma separated) to add products of (use `all` for all domains)')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const brand = interaction.options.getString('brand');
        const domains = interaction.options.getString('domains').toLowerCase().split(',').map(domain => domain.trim());
        const isAllDomain = domains.includes('all') && domains.length === 1;

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

        const isBrandExist = await brandExists(brand);

        if (!isBrandExist) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The brand does not exist**\n\n>>> Please add the brand first or use \`list-brands\` to list all the available brands`, color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        const query = {
            brand: brand,
            domains: isAllDomain ? 'all' : domains
        }

        return await interaction.editReply('Hello');
    },
};