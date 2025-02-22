const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment-timezone');
const { getAllGuildSubscriptions } = require('../../../database/models/subscription');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { otherGuilds1 } = require('../../../config.json');
const { getGuildConfig } = require('../../../database/models/guildConfig');

const ITEMS_PER_PAGE = 5;
const FIRST_PAGE_ITEMS = 4;
const SHOW_DESCRIPTION_ON_ALL_PAGES = true;
const DESCRIPTION = `This is a list of all active subscriptions. Use \`/add-subscription\` to add more.\n`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-subscriptions')
        .setDescription('List all active role subscriptions'),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        const guildId = interaction.guild.id;

        const subscriptions = getAllGuildSubscriptions(guildId);

        const premiumRoleId = getGuildConfig(guildId, 'premium_role_id');

        try {

        if (subscriptions.length === 0) {
            const errorEmbed = simpleEmbed({
                description: `**No active subscriptions**\n\n>>> You can add subscriptions using \`/add-subscription\``,
                color: 'Yellow',
            });
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        let currentPage = 0;
        const totalSubscriptions = subscriptions.length;
        const totalPages = Math.ceil(
            (totalSubscriptions - FIRST_PAGE_ITEMS) / ITEMS_PER_PAGE + 1
        );

        const roleDescription = `**Premium Role**: <@&${premiumRoleId}>\n`;

        const generateEmbed = (page) => {
            let start, end;
            if (page === 0) {
                start = 0;
                end = FIRST_PAGE_ITEMS;
            } else {
                start = FIRST_PAGE_ITEMS + (page - 1) * ITEMS_PER_PAGE;
                end = start + ITEMS_PER_PAGE;
            }

            const paginatedSubscriptions = subscriptions.slice(start, end);

            let descriptionContent = '';
            paginatedSubscriptions.forEach(({ user_id, role_id, added_at, expires_at }) => {
                const addedAtFormatted = moment(added_at).tz('Europe/Rome').format('YYYY-MM-DD HH:mm:ss');
                const expiresAtFormatted = moment(expires_at).tz('Europe/Rome').format('YYYY-MM-DD HH:mm:ss');
                const duration = moment.duration(moment(expires_at).diff(moment(added_at))).humanize();

                descriptionContent += `\n> **User**: <@${user_id}>\n> **Added At**: \`${addedAtFormatted}\`\n> **Expires At**: \`${expiresAtFormatted}\`\n> **Duration Set**: \`${duration}\`\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle('Active Subscriptions')
                .setColor('Random')
                .setFooter({ text: `Total: ${totalSubscriptions}` });

            if (page === 0 || SHOW_DESCRIPTION_ON_ALL_PAGES) {
                embed.setDescription(DESCRIPTION + roleDescription + descriptionContent);
            } else {
                // embed.setDescription(roleDescription + descriptionContent);
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
            time: 60000,
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
            message.edit({ components: [] });
        });

        } catch (error) {
            console.error(error);
            const errorEmbed = simpleEmbed({
                description: `**An error occurred. Please try again later**`,
                color: 'Red',
            });
            return await interaction.reply({ embeds: [errorEmbed] });
        }
    },
};
