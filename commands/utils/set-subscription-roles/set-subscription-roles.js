const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { otherGuilds1 } = require('../../../config.json');
const { addBulkSubscriptionRoles } = require('../../../database/models/subscriptionRoles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-subscription-roles')
        .setDescription('Set subscription roles from a template message')
        .addStringOption(option =>
            option.setName('template-message-link')
                .setDescription('Message link to extract roles from')
                .setRequired(true)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const guildId = interaction.guild.id;

            // Get the message link input
            const messageLink = interaction.options.getString('template-message-link');

            // Validate the message link format
            const linkMatch = messageLink.match(/^https:\/\/(?:www\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
            if (!linkMatch) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**Invalid message link format**', color: 'Red' })]
                });
            }

            const [_, linkGuildId, channelId, messageId] = linkMatch;
            if (linkGuildId !== interaction.guildId) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**Message link must be from this server**', color: 'Red' })]
                });
            }

            // Fetch the channel where the template message is located
            const templateChannel = await interaction.guild.channels.fetch(channelId).catch(() => null);
            if (!templateChannel || templateChannel.type !== ChannelType.GuildText) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**Invalid template channel**', color: 'Red' })]
                });
            }

            // Fetch the template message
            const templateMessage = await templateChannel.messages.fetch(messageId).catch(() => null);
            if (!templateMessage) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**Invalid template message**', color: 'Red' })]
                });
            }

            // Use a regex to extract all role mentions from the message content
            const roleMentionRegex = /<@&(\d+)>/g;
            const rolesSet = new Set();
            let match;
            while ((match = roleMentionRegex.exec(templateMessage.content)) !== null) {
                const roleId = match[1];
                const role = interaction.guild.roles.cache.get(roleId);
                if (role) rolesSet.add(role);
            }

            const rolesArray = Array.from(rolesSet);

            if (rolesArray.length === 0) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**No roles found in the template message**', color: 'Red' })]
                });
            }

            // Format the list of roles as a string of role mentions
            const rolesList = rolesArray.map(role => role.toString()).join(', ');

            const roleIds = rolesArray.map(role => role.id);

            const setRoles = addBulkSubscriptionRoles(guildId, roleIds);

            if (!setRoles) {
                return interaction.editReply({
                    embeds: [simpleEmbed({ description: '**Something went wrong, please try again later**', color: 'Red' })]
                });
            }

            let successTitle = '';

            if (setRoles.successful.length > 0) {
                successTitle += `**Roles added successfully**`;
            } else {
                successTitle += `**No new roles added**`;
            }

            const embedColor = setRoles.successful.length > 0 && setRoles.duplicates.length === 0 && setRoles.errors.length === 0 ? 'Green' :
                setRoles.successful.length > 0 && (setRoles.duplicates.length > 0 || setRoles.errors.length > 0) ? 'Yellow' : 'Red';

            const embed = simpleEmbed(
                {
                    title: successTitle,
                    description: `> Following are the details`,
                    color: embedColor
                }
            ).setFooter(
                { text: `${interaction.guild.name} | Subscription Roles`, iconURL: interaction.guild.iconURL() }
            )

            const duplicateRolesList = setRoles.duplicates.map(roleId => `<@&${roleId}>`).join(', ');
            const errorRolesList = setRoles.errors.map(roleId => `<@&${roleId}>`).join(', ');
            const successfulRolesList = setRoles.successful.map(roleId => `<@&${roleId}>`).join(', ');

            embed.addFields(
                { name: 'Roles Found', value: rolesList, inline: false }
            );

            if (setRoles.duplicates.length > 0) {
                embed.addFields(
                    { name: 'Duplicate Roles', value: duplicateRolesList, inline: false }
                );
            }

            if (setRoles.errors.length > 0) {
                embed.addFields(
                    { name: 'Error Roles', value: errorRolesList, inline: false }
                );
            }

            if (setRoles.successful.length > 0) {
                embed.addFields(
                    { name: 'Added Roles', value: successfulRolesList, inline: false }
                );
            }

            return interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Get Roles Error:', error);
            return interaction.editReply({
                embeds: [simpleEmbed({ description: '**Something went wrong, pleas try again later**', color: 'Red' })]
            });
        }
    }
};
