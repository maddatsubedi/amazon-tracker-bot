const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { getAllBrands } = require('../../../database/models/asins');

const ITEMS_PER_PAGE = 5;
const FIRST_PAGE_ITEMS = 4;
const SHOW_DESCRIPTION_ON_ALL_PAGES = true;
const DESCRIPTION = `This is a list of all available brands. Use \`/add-brand\` to add more brands.\n`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-brands')
        .setDescription('List all the available brands'),
    isAdmin: true,
    async execute(interaction) {
        const brands = await getAllBrands();

        if (brands.length === 0) {
            const errorEmbed = simpleEmbed({
                description: `**No brands available**\n\n>>> You can add brands using \`/add-brand\``,
                color: 'Yellow',
            });
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        let currentPage = 0;
        const totalBrands = brands.length;

        const totalPages = Math.ceil(
            (totalBrands - FIRST_PAGE_ITEMS) / ITEMS_PER_PAGE + 1
        );

        const generateEmbed = (page) => {
            let start, end;
            if (page === 0) {
                start = 0;
                end = FIRST_PAGE_ITEMS;
            } else {
                start = FIRST_PAGE_ITEMS + (page - 1) * ITEMS_PER_PAGE;
                end = start + ITEMS_PER_PAGE;
            }

            const paginatedBrands = brands.slice(start, end);

            let descriptionContent = '';
            paginatedBrands.forEach(({ name, domains, channel_id, tracking }) => {
                descriptionContent += `\n> **Brand**: \`${name}\`\n> **Domains**: \`${domains}\`\n> **Channel**: <#${channel_id}>\n> **Tracking**: \`${tracking ? 'Yes' : 'No'}\`\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle('Available Brands')
                .setColor('Random')
                .setFooter({ text: `Total: ${totalBrands}` });

            // Add main description only on the first page or based on the flag
            if (page === 0 || SHOW_DESCRIPTION_ON_ALL_PAGES) {
                embed.setDescription(DESCRIPTION + descriptionContent);
            } else {
                embed.setDescription(descriptionContent);
            }

            return embed;
        };

        const generateButtons = (page) => {
            const actionRow = new ActionRowBuilder();
            actionRow.addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('⬅️ Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('pagination_info')
                    .setLabel(`Page ${page + 1} / ${totalPages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Next ➡️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages - 1)
            );
            return actionRow;
        };

        const initialEmbed = generateEmbed(currentPage);
        const initialButtons = generateButtons(currentPage);

        const message = await interaction.reply({
            embeds: [initialEmbed],
            components: [initialButtons],
            fetchReply: true,
        });

        const collector = message.createMessageComponentCollector({
            filter: (btnInteraction) => btnInteraction.user.id === interaction.user.id,
            time: 60000, // 1 minute
        });

        collector.on('collect', async (btnInteraction) => {
            if (btnInteraction.customId === 'prev_page' && currentPage > 0) {
                currentPage--;
            } else if (btnInteraction.customId === 'next_page' && currentPage < totalPages - 1) {
                currentPage++;
            }

            const updatedEmbed = generateEmbed(currentPage);
            const updatedButtons = generateButtons(currentPage);

            await btnInteraction.update({
                embeds: [updatedEmbed],
                components: [updatedButtons],
            });
        });

        collector.on('end', () => {
            message.edit({ components: [] }); // Remove all buttons after collector ends
        });
    },
};
