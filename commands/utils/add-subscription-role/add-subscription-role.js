const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { otherGuilds1 } = require('../../../config.json');
const { addBulkSubscriptionRoles, getSubscriptionRoles, removeSubscriptionRole, addSubscriptionRole } = require('../../../database/models/subscriptionRoles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-subscription-role')
        .setDescription('Add a subscription role')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to add to subscription roles')
                .setRequired(true)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const roleId = interaction.options.getRole('role').id;

        try {
            await interaction.deferReply();

            const subscriptionRoles = getSubscriptionRoles(guildId);

            if (subscriptionRoles.some(role => role.role_id === roleId)) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**Role already exists in subscription roles**', color: 'Red' })]
                });
            }

            addSubscriptionRole(guildId, roleId);

            const embed = simpleEmbed(
                {
                    title: "Subscription Role Added",
                    description: `> Role has been added to subscription roles`,
                    color: 'Random'
                }
            ).setFooter(
                { text: `${interaction.guild.name} | Subscription Roles`, iconURL: interaction.guild.iconURL() }
            ).addFields(
                { name: 'Role Added', value: `<@&${roleId}>`, inline: false }
            );

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Add Role Error:', error);
            return interaction.editReply({
                embeds: [simpleEmbed({ description: '**Something went wrong, pleas try again later**', color: 'Red' })]
            });
        }
    }
};
