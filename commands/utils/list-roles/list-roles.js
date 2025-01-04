const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getAllRoles } = require('../../../database/models/roles');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');

const ITEMS_PER_PAGE = 5;
const FIRST_PAGE_ITEMS = 4;
const SHOW_DESCRIPTION_ON_ALL_PAGES = true;
const DESCRIPTION = `This is a list of all roles in the system, including their associated users and expiration dates.\n`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-roles')
        .setDescription('List all roles in the system with pagination'),

    async execute(interaction) {
        const roles = getAllRoles();

        if (!roles.length) {
            const emptyEmbed = simpleEmbed({
                description: `**No roles are currently configured**\n\n>>> You can roles to users using \`/add-role\``,
                color: 'Yellow',
                totalPages: 1
            });
            return await interaction.reply({ embeds: [emptyEmbed] });
        }

        let currentPage = 0;
        const totalRoles = roles.length;

        // Total pages calculation adjusted for first page items
        const totalPages = Math.ceil(
            (totalRoles - FIRST_PAGE_ITEMS) / ITEMS_PER_PAGE + 1
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

            const paginatedRoles = roles.slice(start, end);

            let descriptionContent = '';
            paginatedRoles.forEach(({ user_id, role_id, added_at, expires_at }) => {
                descriptionContent += `\n> **User**: <@${user_id}>\n> **Role**: <@&${role_id}>\n> **Added At**: \`${added_at}\`\n> **Expires At**: \`${expires_at}\`\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle('Roles List')
                .setColor('Random')
                .setFooter({ text: `Total: ${totalRoles}` });

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
            time: 60000, // Collector timeout: 1 minute
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
            message.edit({ components: [] }); // Remove buttons after timeout
        });
    },
};
