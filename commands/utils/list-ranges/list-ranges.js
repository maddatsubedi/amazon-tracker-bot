const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getAllRanges } = require('../../../database/models/discount_range');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');

const ITEMS_PER_PAGE = 5;
const FIRST_PAGE_ITEMS = 4;
const SHOW_DESCRIPTION_ON_ALL_PAGES = true;
const DESCRIPTION = `This is a list of all configured discount ranges. Each range is associated with a channel and role to notify.\n`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-ranges')
        .setDescription('List all configured discount ranges'),
    isAdmin: true,
    async execute(interaction) {
        const ranges = getAllRanges();

        if (!ranges.length) {
            const emptyEmbed = simpleEmbed({
                description: '**No discount ranges configured.**',
                color: 'Yellow',
            });
            return await interaction.reply({ embeds: [emptyEmbed] });
        }

        let currentPage = 0;
        const totalRanges = ranges.length;

        // Total pages calculation adjusted for first page items
        const totalPages = Math.ceil(
            (totalRanges - FIRST_PAGE_ITEMS) / ITEMS_PER_PAGE + 1
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

            const paginatedRanges = ranges.slice(start, end);

            let descriptionContent = '';
            paginatedRanges.forEach(({ range, roleID }) => {
                descriptionContent += `\n> **Range**: \`${range}\`\n> **Role**: <@&${roleID}>\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle('Discount Ranges')
                .setColor('Random')
                .setFooter({ text: `Total: ${totalRanges}` });

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
