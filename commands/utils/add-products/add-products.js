const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed, localesEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getChannelAndRole } = require('../../../database/models/discount_range');
const { validateRange, isValidASIN, getDomainIDByLocale, generateRandomHexColor, validateAvailableLocales, calculateTokensRefillTime } = require('../../../utils/helpers');
const { domain } = require('../../../utils/keepa.json');
const { getProductDetails, getProductGraphBuffer, addProducts } = require('../../../utils/keepaApis');
const { getAllBrands, brandExists } = require('../../../database/models/asins');

let isAddingProducts = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-products')
        .setDescription('Add products to the database')
        .addStringOption(option =>
            option.setName('brand')
                .setDescription('Brand name to add products of')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        try {

            await interaction.deferReply();

            const infoEmbed = simpleEmbed({
                description: `**This command is currently disabled**\n\n>>> Contact Admin for support`, color: 'Yellow'
            });

            return await interaction.editReply({ embeds: [infoEmbed] });

            if (isAddingProducts) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Products are already being added**\n\n>>> Please wait until the current process is completed`, color: 'Yellow'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            isAddingProducts = true;

            const initialEmbed = simpleEmbed({
                description: `**⏳ \u200b Adding products**\n\n>>> Please wait while products are being added`, color: 'Yellow'
            });

            const initialMessage = await interaction.editReply({ embeds: [initialEmbed] });

            const brand = interaction.options.getString('brand');

            // console.log(brand.length);
            // console.log(domains);

            const isBrandExist = await brandExists(brand);

            if (!isBrandExist) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b The brand does not exist**\n\n>>> Please add the brand first or use \`list-brands\` to list all the available brands`, color: 'Red'
                });
                isAddingProducts = false;
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const result = await addProducts({ brand });
            // console.log(result);

            if (result?.error) {
                if (result.errorType === 'LIMIT_REACHED') {
                    const tokensData = result.data;
                    const tokensRefillTime = calculateTokensRefillTime(tokensData.refillRate, tokensData.refillIn, tokensData.tokensLeft, tokensData.tokensRequired);
                    const errorEmbed = simpleEmbed({
                        description: `**❌ \u200b The limit has been reached**\n\n>>> Please try again later after token automatically refills in \`${tokensRefillTime}\``, color: 'Red'
                    });
                    isAddingProducts = false;
                    return await interaction.editReply({ embeds: [errorEmbed] });
                }

                if (result.errorType === 'PRODUCTS_NOT_FOUND') {
                    const errorEmbed = simpleEmbed({
                        description: `**❌ \u200b No products found**\n\n> **Brand**: ${brand}\n\nPlease try different brand or add another the brand using \`/add-brand\``, color: 'Yellow'
                    });
                    isAddingProducts = false;
                    return await interaction.editReply({ embeds: [errorEmbed] });
                }

                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Something went wrong**\n\n>>> Please try again later`, color: 'Red'
                });

                isAddingProducts = false;
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const data = result.data;
            // console.log(result);

            let errorDomainsString = '';

            if (data.errorLocales) {
                errorDomainsString = `\n\nError occurred on these domains:\n\`${data.errorLocales.join(', ')}\`\n\u200b`;
            }

            if (data.successAsinsCount === 0) {
                const errorEmbed = simpleEmbed({
                    title: `**Products Add**`,
                    description: `**No new products added, below is the complete details**${errorDomainsString ? errorDomainsString : ``}`, color: 'Yellow',
                    footer: `Brand: ${brand}`,
                    setTimestamp: true
                }).addFields(
                    { name: '> Brand', value: `> \`${brand}\``, inline: true },
                    { name: '> Domain', value: `> \`${data.brandDomainsDB.join(', ')}\``, inline: true },
                    { name: '> Products Fetched', value: `> \`${data.totalDataCount}\``, inline: true },
                    { name: '> Products Processed', value: `> \`${data.dataCount}\``, inline: true },
                    { name: '> Total Products (DB)', value: `> \`${data.totalAsinsCount}\``, inline: true },
                );

                if (data.errorAsinsCount > 0) {
                    errorEmbed.addFields(
                        { name: '> Errors', value: `> \`${data.errorAsinsCount}\``, inline: true }
                    );
                }

                if (data.duplicateAsinsCount > 0) {
                    errorEmbed.addFields(
                        { name: '> Duplicates', value: `> \`${data.duplicateAsinsCount}\``, inline: true }
                    );
                }

                const editEmbed = simpleEmbed({
                    description: `**❌ \u200b No new products added**\n\n>>> See the next message for details`, color: 'Yellow'
                });

                isAddingProducts = false;
                await interaction.editReply({ embeds: [editEmbed] });
                return await initialMessage.reply({ embeds: [errorEmbed] });
            }

            const successEmbed = simpleEmbed({
                title: `**Products Add**`,
                description: `**Products added successfully, below is the complete details**${errorDomainsString ? errorDomainsString : ``}`, color: 'Green',
                footer: `Brand: ${brand}`,
                setTimestamp: true
            }).addFields(
                { name: '> Brand', value: `> \`${brand}\``, inline: true },
                { name: '> Domain', value: `> \`${data.brandDomainsDB.join(', ')}\``, inline: true },
                { name: '> Products Fetched', value: `> \`${data.totalDataCount}\``, inline: true },
                { name: '> Products Processed', value: `> \`${data.dataCount}\``, inline: true },
                { name: '> Products Added', value: `> \`${data.successAsinsCount}\``, inline: true },
                { name: '> Total Products (DB)', value: `> \`${data.totalAsinsCount}\``, inline: true },
            );

            if (data.errorAsinsCount > 0) {
                successEmbed.addFields(
                    { name: '> Errors', value: `> \`${data.errorAsinsCount}\``, inline: true }
                );
            }

            if (data.duplicateAsinsCount > 0) {
                successEmbed.addFields(
                    { name: '> Duplicates', value: `> \`${data.duplicateAsinsCount}\``, inline: true }
                );
            }

            const editEmbed = simpleEmbed({
                description: `**✅ \u200b Products added successfully**\n\n>>> See the next message for details`, color: 'Green'
            });

            isAddingProducts = false;
            await interaction.editReply({ embeds: [editEmbed] });
            return await initialMessage.reply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error adding products:', error);
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b Something went wrong**\n\n>>> Please try again later`, color: 'Red'
            });

            isAddingProducts = false;
            return await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};