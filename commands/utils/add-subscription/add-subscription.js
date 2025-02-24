const { SlashCommandBuilder } = require("discord.js");
const { simpleEmbed } = require("../../../embeds/generalEmbeds");
const { parseDuration, } = require("../../../utils/helpers");
const { addSubscription, getSubscription, } = require("../../../database/models/subscription");
const { otherGuilds1 } = require('../../../config.json');
const { getGuildConfig } = require("../../../database/models/guildConfig");
const { log } = require("../../../utils/discordUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add-subscription")
        .setDescription("Add subscription to a user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to add the subscription to")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("duration")
                .setDescription(
                    "Duration e.g. (<x>sec, <x>min, <x>hr, <x>day, <x>wk, <x>mo)"
                )
                .setRequired(true)
        ),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;

        try {
            const user = interaction.options.getUser("user");
            const guildId = interaction.guild.id;
            const duration = interaction.options.getString("duration");
            const premiumRoleId = getGuildConfig(guildId, "premium_role_id");

            if (!premiumRoleId) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Premium role not set**\n\n>>> Please set a premium role using \`/set-premium-role\``,
                    color: "Red",
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (user.bot) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Cannot add role to a bot**\n\n>>> Please select a valid user`,
                    color: "Red",
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const premiumRole = await interaction.guild.roles.cache.get(premiumRoleId);

            if (!premiumRole) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Premium role not found**\n\n>>> Please set a valid premium role using \`/set-premium-role\``,
                    color: "Red",
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const userRoles = await interaction.guild.members.cache.get(user.id).roles.cache;
            const userHasPremiumRole = await userRoles.has(premiumRoleId);
            const subscription = getSubscription(user.id, guildId);
            const userHasSubscription = subscription ? true : false;

            if (userHasPremiumRole && userHasSubscription) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b The user was already subscribed**\n\nPlease select a different user\n\n> **Subscription Configurations**`,
                    color: "Red",
                }).addFields(
                    { name: "User", value: `<@${user.id}>`, inline: true },
                    { name: "Role", value: `<@&${premiumRoleId}>`, inline: true },
                    { name: "Added At", value: `\`${subscription.added_at}\``, inline: true },
                    { name: "Expires At", value: `\`${subscription.expires_at}\``, inline: true }

                );

                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const durationMs = parseDuration(duration);

            if (!durationMs) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Invalid duration**\n\n>>> Please enter a valid duration. Valid duration format:\n\n\`<x>sec, <x>min, <x>hr, <x>day, <x>wk, <x>mo\``,
                    color: "Red",
                });

                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (!userHasPremiumRole) {
                await interaction.guild.members.cache.get(user.id).roles.add(premiumRoleId);
            }

            const currentDate = new Date().toUTCString();
            let expiresAt = new Date(Date.now() + durationMs).toUTCString();
            let addedAt = currentDate;

            if (!userHasSubscription) {
                addSubscription(user.id, guildId, currentDate, duration, expiresAt);
            } else {
                addedAt = subscription.added_at;
                expiresAt = new Date(subscription.expires_at).toUTCString();
            }

            let successDescription = "";

            if (userHasPremiumRole) {
                successDescription = `The premium role was already present on the user profile, new subscription was added to the user`;
            }

            if (userHasSubscription) {
                successDescription = `The user already has subscription, the subscription was updated`;
            }

            if (!userHasPremiumRole && !userHasSubscription) {
                successDescription = `New subscription was added to the user`;
            }

            const successEmbed = simpleEmbed({
                description: `**✅ \u200b Subscription successfully added to the user**\n\n${successDescription}\n\n> **Role Configurations**`,
                color: "Green",
            }).addFields(
                { name: "User", value: `<@${user.id}>`, inline: true },
                { name: "Premium Role", value: `<@&${premiumRoleId}>`, inline: true },
                { name: "Duration", value: `\`${duration}\``, inline: true },
                { name: "Added At", value: `\`${addedAt}\``, inline: true },
                { name: "Expires At", value: `\`${expiresAt}\``, inline: true }
            );

            const logMessageEmbed = simpleEmbed({
                title: 'Subscription Added',
                description: `Subscription added to user`,
                color: 'Green',
                setTimestamp: true,
            }).addFields(
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Premium Role', value: `<@&${premiumRoleId}>`, inline: true },
                { name: 'Added At', value: `\`${addedAt}\``, inline: true },
                { name: 'Expires At', value: `\`${expiresAt}\``, inline: true },
                { name: 'Duration Set', value: `\`${duration}\``, inline: true },
            ).setFooter({
                text: `${guild.name} | Subscription Logs`,
                iconURL: guild.iconURL(),
            })

            const logMessage = { embeds: [logMessageEmbed] };

            await log(logMessage, guildId, interaction.client, "subscription");

            return await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.log(error);
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b An error occurred**\n\n>>> Make sure the bot role is above the premium role or the role is not a bot role`,
                color: "Red",
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
