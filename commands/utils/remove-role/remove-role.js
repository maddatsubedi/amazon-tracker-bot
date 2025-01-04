const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getRangeDetails } = require('../../../database/models/discount_range');
const { validateRange, checkRole } = require('../../../utils/helpers');
const { addRole, checkDBRole, getRole, removeRole } = require('../../../database/models/roles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-role')
        .setDescription('Remove a role from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to remove the role from')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to be removed from the user')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');

            const role = interaction.options.getRole('role');
            const roleID = role.id;

            if (user.bot) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Cannot remove role from a bot**\n\n>>> Please select a valid user`,
                    color: 'Red'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const userRoles = await interaction.guild.members.cache.get(user.id).roles.cache;
            const userHasRole = await userRoles.has(roleID);
            const userHasDBRole = checkDBRole(user.id, roleID);
            const dbRole = getRole(user.id, roleID);

            if (!userHasRole && !userHasDBRole) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b The user does not have the role**\n\nPlease select a different user or choose different role`,
                    color: 'Red'
                }).addFields(
                    { name: 'User', value: `<@${user.id}>`, inline: true },
                    { name: 'Role', value: `<@&${roleID}>`, inline: true },
                );
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            // if (userHasDBRole) {
            //     const errorEmbed = simpleEmbed({
            //         description: `**❌ \u200b The user already has the role in database**\n\n> Please select a different user or choose different role\n\`You can try giving the role manually or use '/remove-role' to remove the role first and '/add-role' to add role again\``, color: 'Red'
            //     }).addFields(
            //         { name: 'User', value: `<@${user.id}>`, inline: true },
            //         { name: 'Role', value: `<@&${roleID}>`, inline: true },
            //     );
            //     return await interaction.editReply({ embeds: [errorEmbed] });
            // }

            if (userHasRole) {
                await interaction.guild.members.cache.get(user.id).roles.remove(roleID);
            }

            let dbSuccess = false;
            let successDescription = '';

            if (userHasDBRole) {
                const result = removeRole(user.id, roleID);
                dbSuccess = result;
            }

            if (userHasDBRole && !dbSuccess) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b An error occurred while removing the role from the user database**\n\n>>> Please try again later`,
                    color: 'Red'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (userHasRole && userHasDBRole) {
                if (dbSuccess) {
                    successDescription = `The role was removed from the user profile and the user database`;
                } else {
                    successDescription = `The role was removed from the user profile but an error occurred while removing the role from the user database\n \`Please try again later\``;
                }
            }

            if (userHasRole && !userHasDBRole) {
                successDescription = `The role was removed from the user profile but it was not present on the user database, so the role was only removed from the user profile`;
            }

            if (userHasDBRole && !userHasRole) {
                successDescription = `The role was removed from the user database but it was not present on the user profile, so the role was only removed from the user database`;
            }

            const successEmbed = simpleEmbed({
                description: `**✅ \u200b Role successfully removed from user**\n\n${successDescription}\n\n> **Role Configurations**`,
                color: 'Green'
            }).addFields(
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Role', value: `<@&${roleID}>`, inline: true },
            );

            if (dbSuccess) {
                successEmbed.addFields(
                    { name: 'Added At', value: `\`${dbRole.added_at}\``, inline: true },
                    { name: 'Expires At', value: `\`${dbRole.expires_at}\``, inline: true },
                );
            }

            return await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            // console.error(error);
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b An error occurred while adding the role**\n\n>>> Make sure the bot role is higher than the role you are trying to remove`,
                color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

    },
};