const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { otherGuilds1 } = require('../../../config.json');
const { addBulkSubscriptionRoles, getSubscriptionRoles, removeSubscriptionRole } = require('../../../database/models/subscriptionRoles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-subscription-role')
        .setDescription('Remove a subscription role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to remove from subscription roles')
                .setRequired(true)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const roleId = interaction.options.getRole('role').id;

        try {
            await interaction.deferReply();

            const subscriptionRoles = getSubscriptionRoles(guildId);

            if (!subscriptionRoles || subscriptionRoles.length === 0) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**No subscription roles found**\n\n>>> You can set subscription roles using \`/set-subscription-roles\`', color: 'Red' })]
                });
            }

            if (!subscriptionRoles.some(role => role.role_id === roleId)) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**Role not found in subscription roles**', color: 'Red' })]
                });
            }

            removeSubscriptionRole(guildId, roleId);

            const embed = simpleEmbed(
                {
                    title: "Subscription Role Removed",
                    description: `> Role has been removed from subscription roles`,
                    color: 'Random'
                }
            ).setFooter(
                { text: `${interaction.guild.name} | Subscription Roles`, iconURL: interaction.guild.iconURL() }
            ).addFields(
                { name: 'Role Removed', value: `<@&${roleId}>`, inline: false }
            );

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Remove Role Error:', error);
            return interaction.editReply({
                embeds: [simpleEmbed({ description: '**Something went wrong, pleas try again later**', color: 'Red' })]
            });
        }
    }
};
