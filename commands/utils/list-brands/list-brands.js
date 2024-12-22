const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed, localesEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getChannelAndRole } = require('../../../database/models/discount_range');
const { validateRange, isValidASIN, getDomainIDByLocale, generateRandomHexColor, validateAvailableLocales } = require('../../../utils/helpers');
const { domain } = require('../../../utils/keepa.json');
const { getProductDetails, getProductGraphBuffer } = require('../../../utils/keepaApis');
const { getAllBrands, brandExists } = require('../../../database/models/asins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-brands')
        .setDescription('List all the available brands'),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const brands = await getAllBrands();
        // console.log(brands);

        if (brands.length === 0) {
            const errorEmbed = simpleEmbed({
                description: `**No brands available**\n\n>>> You can add brands using \`/add-brand\``, color: 'Yellow'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        const brandsString = brands.map(brand => {
            return `> **Brand**: \`${brand.name}\`\n> **Domains**: \`${brand.domains}\``;
        }).join(`\n\n`);

        const brandsEmbed = simpleEmbed({
            title: `**Available Brands**`,
            description: `${brandsString}`,
            color: 'Green'
        });

        return await interaction.editReply({ embeds: [brandsEmbed] });
    },
};