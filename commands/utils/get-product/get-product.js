const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { validateRange, isValidASIN, getDomainIDByLocale, generateRandomHexColor, getAvailableDomains, getAvailabeLocales } = require('../../../utils/helpers');
const { domain } = require('../../../utils/keepa.json');
const { getProductDetails, getProductGraphBuffer } = require('../../../utils/keepaProductApi');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get-product')
        .setDescription('Get details of the single product')
        .addStringOption(option =>
            option.setName('asin')
                .setDescription('ASIN of the product to get details of')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('domain')
                .setDescription('Domain of the product to get details of')
                .setRequired(false)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const asin = interaction.options.getString('asin');
        const domain = interaction.options.getString('domain');

        if (!isValidASIN(asin)) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The ASIN is not valid**\n\n>>> Please give ASIN in this format: \`X0X0X0X0X0\`\nfor e.g. \`B07VW55M8C\``, color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        let domainID;

        const availableLocales = getAvailabeLocales();
        const localesString = availableLocales?.map(locale => `\`${locale}\``).join(`\n`);

        if (domain) {
            domainID = getDomainIDByLocale(domain);

            if (!domainID) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b The domain is not valid**\n\n**Following domains are supported:**\n\n>>> **${localesString}**`, color: 'Red'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }
        }

        domainID ||= 1;

        const fetchProduct = await getProductDetails({ asin: asin, domain: domainID });
        const fetchProductGraphBuffer = await getProductGraphBuffer({ asin: asin, domain: domainID });

        const productGraphAttachment = new AttachmentBuilder(fetchProductGraphBuffer)
        .setName(`productGraph_${asin}.png`);
        // console.log(productGraphAttachment);

        if (!fetchProduct || fetchProduct.error) {

            if (fetchProduct.error && fetchProduct.errorType === 'PRODUCT_NOT_FOUND') {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b No product found of these details:**\n\n> **ASIN**: \`${asin}\`\n> **Domain**: \`${domain || 'com'}\`\n\nPlease check the details and try again.`,
                    color: 'Red'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b Something went wrong**\n\nSomething went wrong while fetching the product details. Please try again later.`,
                color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        const serverIcon = await interaction.guild.iconURL();

        const product = fetchProduct.product;

        const embedColor = generateRandomHexColor();

        // console.log(fetchProduct);

        const embed1 = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Product Details')
            .setURL(product.productURL)
            .setDescription(`**${product.title}**\n\n> **Product Link**: **[Open Link](${product.productURL})**\n> **ASIN**: \`${product.asin}\`\n> **Domain**: \`${product.productDomain}\`\n> **Last Updated**: \`${product.lastUpdateDate}\`\n> **Last Price Updated**: \`${product.lastPriceUpdateDate}\``)
            .setThumbnail(product.images?.[1])


        const embed2 = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Price Details')
            .addFields(
                { name: 'Amazon', value: `> ${product.amazonPriceData.lastPrice !== `Out of Stock` ? `**Price**: ${product.amazonPriceData.lastPrice}` : `**Out of Stock**`} | \`${product.usedPriceData.lastTimestamp}\`` },
                { name: 'New', value: `> ${product.newPriceData.lastPrice !== `Out of Stock` ? `**Price**: ${product.newPriceData.lastPrice}` : `**Out of Stock**`} | \`${product.usedPriceData.lastTimestamp}\`` },
                { name: 'Used', value: `> ${product.usedPriceData.lastPrice !== `Out of Stock` ? `**Price**: ${product.usedPriceData.lastPrice}` : `**Out of Stock**`} | \`${product.usedPriceData.lastTimestamp}\`` },
                { name: 'Buy Box', value: `> ${product.buyBoxPrice !== `Out of Stock` ? `**Price**: ${product.buyBoxPrice}` : `**Out of Stock**`}` },
            )
            .setImage(product.images?.[0])
            .setTimestamp()
            .setFooter({ text: `Product Details | ${product.productDomain} | ${product.asin}`, iconURL: serverIcon });

        const graphEmbed = simpleEmbed({
            description: `**📊 \u200b Price Graph of the product: \`${product.asin}\`**`,
            color: embedColor
        });

        await interaction.editReply({ embeds: [embed1, embed2] });
        return await interaction.followUp({ files: [productGraphAttachment], embeds: [graphEmbed] });
    },
};