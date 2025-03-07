const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getRangeDetails } = require('../../../database/models/discount_range');
const { validateRange, checkRole } = require('../../../utils/helpers');
const { getSubscription, removeSubscription } = require('../../../database/models/subscription');
const { otherGuilds1 } = require('../../../config.json');
const { getGuildConfig } = require('../../../database/models/guildConfig');
const { getSubscriptionRoles } = require('../../../database/models/subscriptionRoles');
const { log, safeField } = require('../../../utils/discordUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get-subscription')
        .setDescription('Remove subscription from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove the subscription from')
                .setRequired(false)),
    // isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {

            const interactionUser = interaction.user;
            const interactionMember = await interaction.guild.members.fetch(interactionUser.id).catch(() => null);

            const user = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);
            const guildId = interaction.guild.id;

            const isInteractionUser = interactionUser.id === user.id;

            const adminRoleId = getGuildConfig(guildId, 'adminRoleID');
            const isAdmin = checkRole(interactionMember, adminRoleId);

            const premiumRoleId = getGuildConfig(guildId, "premium_role_id");
            const premiumRole = await interaction.guild.roles.cache.get(premiumRoleId);

            const userRoles = await member.roles.cache;
            const userHasRole = await userRoles.has(premiumRoleId);

            const subscription = getSubscription(user.id, guildId);
            const userHasSubscription = subscription ? true : false;

            const subscriptionRoles = getSubscriptionRoles(guildId);
            const userSubscriptionRoles = subscriptionRoles ? subscriptionRoles.filter(role => userRoles.has(role.role_id)) : [];
            const userSubscriptionRolesList = userSubscriptionRoles.map(role => `<@&${role.role_id}>`).join(', ');
            const userHasSubscriptionRoles = userSubscriptionRoles.length > 0;

            if (!isAdmin && !isInteractionUser) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b You are not allowed to see others subscription**\n\n>>> You can only see your own subscription`,
                    color: 'Red'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (user.bot) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Cannot get subscription for a bot**\n\n>>> Please select a valid user`,
                    color: 'Red'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (!userHasRole && !userHasSubscription && !userHasSubscriptionRoles) {
                const errorEmbed = simpleEmbed({
                    description: `❌ \u200b ${isInteractionUser ? "**You do not have the active subscription**" : "**The user does not have the active subscription** \n\nPlease select a different user"}`,
                    color: 'Red'
                });
                if (!isInteractionUser) {
                    errorEmbed.addFields(
                        { name: 'User', value: `<@${user.id}>`, inline: true },
                    );;
                }
                return await interaction.editReply({ embeds: [errorEmbed] });
            }


            // if (userHasSubscription && !dbSuccess) {
            //     const errorEmbed = simpleEmbed({
            //         description: `**❌ \u200b An error occurred while removing the role from the user database**\n\n>>> Please try again later`,
            //         color: 'Red'
            //     });
            //     return await interaction.editReply({ embeds: [errorEmbed] });
            // }

            const premiumRoleStatus = !premiumRole ? `Not Found in the server` : userHasRole ? `<@&${premiumRoleId}> (Has Role)` : `<@&${premiumRoleId}> (Does Not Have Role)`;

            let description;

            if (userHasSubscriptionRoles && userHasSubscription && userHasRole) {
                description = `${isInteractionUser ? "You have" : "The user has"} the active subscription and some subscription roles`;
            } else if (userHasSubscriptionRoles && userHasSubscription && !userHasRole) {
                description = `${isInteractionUser ? "You have" : "The user has"} the active subscription but no premium role`;
            } else if (userHasSubscriptionRoles && !userHasSubscription && userHasRole) {
                description = `${isInteractionUser ? "You have" : "The user has"} some subscription roles but no active subscription`;
            } else if (userHasSubscriptionRoles && !userHasSubscription && !userHasRole) {
                description = `${isInteractionUser ? "You have" : "The user has"} some subscription roles but no active subscription and no premium role`;
            } else if (!userHasSubscriptionRoles && userHasSubscription && userHasRole) {
                description = `${isInteractionUser ? "You have" : "The user has"} the active subscription but no subscription roles`;
            } else if (!userHasSubscriptionRoles && userHasSubscription && !userHasRole) {
                description = `${isInteractionUser ? "You have" : "The user has"} the active subscription but no subscription roles and no premium role`;
            } else if (!userHasSubscriptionRoles && !userHasSubscription && userHasRole) {
                description = `${isInteractionUser ? "You have" : "The user has"} the premium role but no active subscription and no subscription roles`;
            }

            const successEmbed = simpleEmbed({
                title: 'Subscription Details',
                description: `> ${description}`,
                color: 'Random',
            }).addFields(
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Premium Role', value: premiumRoleStatus, inline: true },
            ).setFooter({
                text: `${interaction.guild.name} | Subscription`,
                iconURL: interaction.guild.iconURL(),
            }).setThumbnail(user.displayAvatarURL({ dynamic: true }));

            if (userHasSubscriptionRoles) {
                successEmbed.addFields({ name: 'Subscription Roles', value: safeField(userSubscriptionRolesList), inline: false });
            }

            if (userHasSubscription) {
                successEmbed.addFields(
                    { name: 'Added At', value: `\`${subscription.added_at}\``, inline: true },
                    { name: 'Expires At', value: `\`${subscription.expires_at}\``, inline: true },
                    { name: 'Duration Set', value: `\`${subscription.duration}\``, inline: true },
                );
            }

            return await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b An error occurred while getting the role**\n\n>>> Please try again later`,
                color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

    },
};