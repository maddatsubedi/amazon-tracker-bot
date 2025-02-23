const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { otherGuilds1 } = require('../../../config.json');
const { getSubscriptionRoles, clearSubscriptionRoles } = require('../../../database/models/subscriptionRoles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-subscription-roles')
        .setDescription('Clear all subscription roles or only those mentioned in a message')
        .addStringOption(option =>
            option.setName('message-link')
                .setDescription('Optional: Provide a message link to clear only roles mentioned in that message')
                .setRequired(false)
        ),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        const guildId = interaction.guild.id;
        try {
            await interaction.deferReply();

            // Check if a message link was provided
            const messageLink = interaction.options.getString('message-link');

            // If provided, clear only roles from that message
            if (messageLink) {
                // Validate the message link format
                const linkMatch = messageLink.match(/^https:\/\/(?:www\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
                if (!linkMatch) {
                    return interaction.editReply({
                        embeds: [simpleEmbed({ description: '**Invalid message link format**', color: 'Red' })]
                    });
                }

                const [ , linkGuildId, channelId, messageId ] = linkMatch;
                if (linkGuildId !== interaction.guildId) {
                    return interaction.editReply({
                        embeds: [simpleEmbed({ description: '**Message link must be from this server**', color: 'Red' })]
                    });
                }

                // Fetch the channel where the target message is located
                const targetChannel = await interaction.guild.channels.fetch(channelId).catch(() => null);
                if (!targetChannel || targetChannel.type !== ChannelType.GuildText) {
                    return interaction.editReply({
                        embeds: [simpleEmbed({ description: '**Invalid target channel**', color: 'Red' })]
                    });
                }

                // Fetch the target message
                const targetMessage = await targetChannel.messages.fetch(messageId).catch(() => null);
                if (!targetMessage) {
                    return interaction.editReply({
                        embeds: [simpleEmbed({ description: '**Invalid target message**', color: 'Red' })]
                    });
                }

                // Extract roles from the message content using regex
                const roleMentionRegex = /<@&(\d+)>/g;
                const rolesSet = new Set();
                let match;
                while ((match = roleMentionRegex.exec(targetMessage.content)) !== null) {
                    const roleId = match[1];
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (role) rolesSet.add(role);
                }
                const rolesArray = Array.from(rolesSet);
                if (rolesArray.length === 0) {
                    return interaction.editReply({
                        embeds: [simpleEmbed({ description: '**No roles found in the provided message**', color: 'Red' })]
                    });
                }
                // Get the role IDs from the message
                const roleIdsFromMessage = rolesArray.map(role => role.id);

                // Get the current subscription roles for the guild
                const currentSubscriptionRoles = getSubscriptionRoles(guildId);
                if (!currentSubscriptionRoles || currentSubscriptionRoles.length === 0) {
                    return interaction.editReply({
                        embeds: [simpleEmbed({ description: '**No subscription roles found**', color: 'Red' })]
                    });
                }

                // Filter only those subscription roles that match the role IDs from the message
                const rolesToRemove = currentSubscriptionRoles.filter(sub => roleIdsFromMessage.includes(sub.role_id));
                if (rolesToRemove.length === 0) {
                    return interaction.editReply({
                        embeds: [simpleEmbed({ description: '**None of the roles in the provided message are set as subscription roles**', color: 'Red' })]
                    });
                }

                // Remove only the filtered roles.
                // (Assuming clearSubscriptionRoles accepts a second parameter: an array of role IDs to clear.)
                clearSubscriptionRoles(guildId, rolesToRemove.map(r => r.role_id));

                const removedRolesList = rolesToRemove.map(r => `<@&${r.role_id}>`).join(', ');
                const embed = simpleEmbed({
                    title: "Subscription Roles Removed from Message",
                    description: `> The following subscription roles were removed from the provided message:`,
                    color: 'Random'
                })
                    .setFooter({ text: `${interaction.guild.name} | Subscription Roles`, iconURL: interaction.guild.iconURL() })
                    .addFields({ name: 'Roles Removed', value: removedRolesList, inline: false });

                return interaction.editReply({ embeds: [embed] });

            } else {
                // If no message link is provided, clear all subscription roles
                const subscriptionRoles = getSubscriptionRoles(guildId);
                if (!subscriptionRoles || subscriptionRoles.length === 0) {
                    return interaction.editReply({
                        embeds: [simpleEmbed({ description: '**No subscription roles found**\n\n>>> You can set subscription roles using `/set-subscription-roles`', color: 'Red' })]
                    });
                }

                // Format list of all roles as mentions
                const rolesList = subscriptionRoles.map(role => `<@&${role.role_id}>`).join(', ');
                clearSubscriptionRoles(guildId);

                const embed = simpleEmbed({
                    title: "Subscription Roles Cleared",
                    description: `> The following subscription roles were cleared from this server:`,
                    color: 'Random'
                })
                    .setFooter({ text: `${interaction.guild.name} | Subscription Roles`, iconURL: interaction.guild.iconURL() })
                    .addFields({ name: 'Roles Cleared', value: rolesList, inline: false });

                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Clear Roles Error:', error);
            return interaction.editReply({
                embeds: [simpleEmbed({ description: '**Something went wrong, please try again later**', color: 'Red' })]
            });
        }
    }
};