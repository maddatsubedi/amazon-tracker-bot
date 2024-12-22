const { SlashCommandBuilder } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { brandExists, getAllBrands, deleteBrandAndAsins } = require('../../../database/models/asins');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-brand')
        .setDescription('Delete a brand from the database')
        .addStringOption(option =>
            option.setName('brand')
                .setDescription('Brand name to delete')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        const brand = interaction.options.getString('brand');

        const brandExistsCheck = await brandExists(brand);
        if (!brandExistsCheck) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The brand does not exist**\n\n>>> Please check the brand name and try again.`,
                color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

        await deleteBrandAndAsins(brand);

        const successEmbed = simpleEmbed({
            description: `**✅ \u200b The brand has been deleted successfully**\n\n> **Brand**: \`${brand}\``,
            color: 'Green'
        });
        return await interaction.editReply({ embeds: [successEmbed] });
    },
};
