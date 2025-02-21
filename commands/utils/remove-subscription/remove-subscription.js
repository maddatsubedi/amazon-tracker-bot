const { SlashCommandBuilder } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getRangeDetails } = require('../../../database/models/discount_range');
const { validateRange, checkRole } = require('../../../utils/helpers');
const { getSubscription, removeSubscription } = require('../../../database/models/subscription');
const { otherGuilds1 } = require('../../../config.json');
const { getGuildConfig } = require('../../../database/models/guildConfig');
const { getSubscriptionRoles } = require('../../../database/models/subscriptionRoles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-subscription')
        .setDescription('Remove subscription from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove the subscription from')
                .setRequired(true)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');
            const guildId = interaction.guild.id;

            const premiumRoleId = getGuildConfig(guildId, "premium_role_id");

            if (!premiumRoleId) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Premium role not set**\n\n>>> Please set a premium role using \`/set-premium-role\``,
                    color: "Red",
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const premiumRole = await interaction.guild.roles.cache.get(premiumRoleId);

            if (user.bot) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Cannot manage subscription for a bot**\n\n>>> Please select a valid user`,
                    color: 'Red'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const member = interaction.guild.members.cache.get(user.id);

            const userRoles = await member.roles.cache;
            const userHasRole = await userRoles.has(premiumRoleId);
            const subscription = getSubscription(user.id, guildId);
            const userHasSubscription = subscription ? true : false;

            const subscriptionRoles = getSubscriptionRoles(guildId);

            const userHasSubscriptionRole = subscriptionRoles ? subscriptionRoles.some(role => userRoles.has(role.role_id)) : false;

            if (!userHasRole && !userHasSubscription && !userHasSubscriptionRole) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b The user does not have the subscription**\n\nPlease select a different user`,
                    color: 'Red'
                }).addFields(
                    { name: 'User', value: `<@${user.id}>`, inline: true },
                );
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const removedSubscriptionRoles = [];
            const errorSubscriptionRoles = [];

            if (subscriptionRoles) {
                const subscriptionRoleIds = new Set(subscriptionRoles.map(role => role.role_id));
                const userRoles = member.roles.cache;

                for (const role of userRoles.values()) {
                    if (subscriptionRoleIds.has(role.id)) {
                        let flag = false;
                        await member.roles.remove(role).catch((error) => {
                            console.log(`Error removing subscription role ${role.name} from ${member.user.username}`);
                            console.log(error.message);
                            errorSubscriptionRoles.push(role.id);
                            flag = true;
                        });

                        if (flag) continue;

                        removedSubscriptionRoles.push(role.id);
                        console.log(`Removed subscription role ${role.name} (id: ${role.id}) from ${member.user.username}`);
                    }
                }
            } else {
                console.log(`No subscription roles found for guild: ${guildId}`);
            }

            let roleRemoveError = false;
            if (userHasRole) {
                await member.roles.remove(premiumRoleId).catch((error) => {
                    console.log(`Error removing premium role from ${user.username}`);
                    console.log(error.message);
                    roleRemoveError = true;
                });
            }

            // const premiumRoleStatus = roleRemoveError ? 'Failed To Remove' : userHasRole ? 'Removed' : 'Not Found';
            const premiumRoleStatus = !premiumRole ? 'Not Found' : roleRemoveError ? 'Failed To Remove' : userHasRole ? 'Removed' : 'User Does Not Have Role';

            let dbSuccess = false;
            let successDescription = '';

            if (userHasSubscription) {
                const result = removeSubscription(user.id, guildId);
                dbSuccess = result;
            }

            // if (userHasSubscription && !dbSuccess) {
            //     const errorEmbed = simpleEmbed({
            //         description: `**❌ \u200b An error occurred while removing the role from the user database**\n\n>>> Please try again later`,
            //         color: 'Red'
            //     });
            //     return await interaction.editReply({ embeds: [errorEmbed] });
            // }

            if (userHasRole && userHasSubscription) {
                if (dbSuccess) {
                    successDescription = `The role was removed from the user profile and the subscription was removed`;
                } else {
                    successDescription = `The role was removed from the user profile but an error occurred while removing subscription from database\n\`Please try again later\``;
                }
            }

            if (userHasRole && !userHasSubscription) {
                successDescription = `The role was removed from the user profile but the subscription was not present in the database, so the role was only removed from the user profile`;
            }

            if (userHasSubscription && !userHasRole) {
                successDescription = `The subscription was removed from the database but the role was not present in the user profile, so the subscription was only removed from the database`;
            }

            if (!userHasRole && !userHasSubscription && userHasSubscriptionRole) {
                successDescription = `The user does not have the subscription but has subscription roles, these roles were removed from the user profile`;
            }

            const successEmbed = simpleEmbed({
                description: `**✅ \u200b Premium Role successfully removed from user**\n\n${successDescription ? `${successDescription}\n\n` : ``}> **Role Configurations**`,
                color: 'Green'
            }).addFields(
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Role', value: `<@&${premiumRoleId}> (${premiumRoleStatus})`, inline: true },
            );

            if (userHasSubscription) {
                successEmbed.addFields(
                    { name: 'Added At', value: `\`${subscription.added_at}\``, inline: true },
                    { name: 'Expires At', value: `\`${subscription.expires_at}\``, inline: true },
                    { name: 'Duration Set', value: `\`${subscription.duration}\``, inline: true },
                );
            }

            if (removedSubscriptionRoles.length > 0) {
                const removedSubscriptionRolesString = removedSubscriptionRoles.map(role => `<@&${role}>`).join(', ');
                successEmbed.addFields(
                    { name: 'Removed Roles', value: removedSubscriptionRolesString, inline: false }
                );
            }

            if (errorSubscriptionRoles.length > 0) {
                const errorSubscriptionRolesString = errorSubscriptionRoles.map(role => `<@&${role}>`).join(', ');
                successEmbed.addFields(
                    { name: 'Error Roles', value: errorSubscriptionRolesString, inline: false }
                );
            }

            return await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error(error);
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b An error occurred while adding the role**\n\n>>> Make sure the bot role is higher than the role you are trying to remove`,
                color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

    },
};