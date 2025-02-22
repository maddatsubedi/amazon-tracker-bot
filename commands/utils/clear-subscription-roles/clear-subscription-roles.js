const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { otherGuilds1 } = require('../../../config.json');
const { addBulkSubscriptionRoles, getSubscriptionRoles, clearSubscriptionRoles } = require('../../../database/models/subscriptionRoles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-subscription-roles')
        .setDescription('Clear all subscription roles'),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        const guildId = interaction.guild.id;

        try {
            await interaction.deferReply();

            const subscriptionRoles = getSubscriptionRoles(guildId);

            if (!subscriptionRoles || subscriptionRoles.length === 0) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**No subscription roles found**\n\n>>> You can set subscription roles using \`/set-subscription-roles\`', color: 'Red' })]
                });
            }

            // Format the list of roles as a string of role mentions
            const rolesList = subscriptionRoles.map(role => `<@&${role.role_id}>`).join(', ');

            clearSubscriptionRoles(guildId);

            const embed = simpleEmbed(
                {
                    title: "Subscription Roles Cleared",
                    description: `> Following are the subscription roles cleared from this server`,
                    color: 'Random'
                }
            ).setFooter(
                { text: `${interaction.guild.name} | Subscription Roles`, iconURL: interaction.guild.iconURL() }
            ).addFields(
                { name: 'Roles Cleared', value: rolesList, inline: false }
            );

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Clear Roles Error:', error);
            return interaction.editReply({
                embeds: [simpleEmbed({ description: '**Something went wrong, pleas try again later**', color: 'Red' })]
            });
        }
    }
};
