const { SlashCommandBuilder } = require('discord.js');
const { simpleEmbed, localesEmbed } = require('../../../embeds/generalEmbeds');
const { validateAvailableLocales } = require('../../../utils/helpers');
const { brandExists, addDomainToBrand, getAllBrands } = require('../../../database/models/asins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit-brand')
        .setDescription('Edit an existing brand\'s domains')
        .addStringOption(option =>
            option.setName('brand')
                .setDescription('Brand name to edit')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('domains')
                .setDescription('New domains (comma-separated)')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const brand = interaction.options.getString('brand');
        const domains = interaction.options.getString('domains').toLowerCase().split(',').map(domain => domain.trim());

        const brandExistsCheck = await brandExists(brand);
        if (!brandExistsCheck) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The brand does not exist**\n\n>>> Please use \`/add-brand\` to add it first or use \`list-brands\` to see the availabe brands.`,
                color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        const validateDomains = validateAvailableLocales(domains);
        if (!validateDomains.isValid) {
            const invalidLocalesString = validateDomains.invalidLocales.map(locale => `\`${locale}\``).join('\n');
            const duplicateLocalesString = validateDomains.duplicateLocales.map(locale => `\`${locale}\``).join('\n');
            
            let errorDescription = '';
            if (validateDomains.invalidLocales.length > 0) {
                errorDescription += `**Invalid domains:**\n${invalidLocalesString}\n\n`;
            }
            if (validateDomains.duplicateLocales.length > 0) {
                errorDescription += `**Duplicate domains:**\n${duplicateLocalesString}\n\n`;
            }
            
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The domains are not valid**\n\n${errorDescription}`,
                color: 'Red'
            });
            const locales_Embed = localesEmbed();
            return await interaction.editReply({ embeds: [errorEmbed, locales_Embed] });
        }

        const newDomains = domains.join(',');
        await addDomainToBrand(brand, newDomains);

        const successEmbed = simpleEmbed({
            description: `**✅ \u200b The brand has been updated successfully**\n\n> **Brand**: \`${brand}\`\n> **New Domains**: \`${newDomains}\``,
            color: 'Green'
        });
        return await interaction.editReply({ embeds: [successEmbed] });
    },
};
