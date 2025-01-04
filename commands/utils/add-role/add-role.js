const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getRangeDetails } = require('../../../database/models/discount_range');
const { validateRange, checkRole } = require('../../../utils/helpers');
const { addRole, checkDBRole, getRole } = require('../../../database/models/roles');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-role')
        .setDescription('Add a role to a user for certain time')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to add the role to')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to be added to the user')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration for which the role will be added to the user')
                .addChoices(
                    { name: '1 Minute', value: '1min' },
                    { name: '1 Day', value: '1d' },
                    { name: '1 Week', value: '1w' },
                    { name: '1 Month', value: '1m' },
                )
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        await interaction.deferReply();

        try {

            const user = interaction.options.getUser('user');

            const role = interaction.options.getRole('role');
            const roleID = role.id;

            const duration = interaction.options.getString('duration');

            if (user.bot) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b Cannot add role to a bot**\n\n>>> Please select a valid user`, color: 'Red'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const userRoles = await interaction.guild.members.cache.get(user.id).roles.cache;
            const userHasRole = await userRoles.has(roleID);
            const userHasDBRole = checkDBRole(user.id, roleID);
            const dbRole = getRole(user.id, roleID);
            
            if (userHasRole && userHasDBRole) {
                const errorEmbed = simpleEmbed({
                    description: `**❌ \u200b The user already has the role**\n\nPlease select a different user or choose different role\n\n> **Role Configurations on database**`
                    , color: 'Red'
                }).addFields(
                    { name: 'User', value: `<@${user.id}>`, inline: true },
                    { name: 'Role', value: `<@&${roleID}>`, inline: true },
                );

                if (dbRole) {
                    errorEmbed.addFields(
                        { name: 'Added At', value: `\`${dbRole.added_at}\``, inline: true },
                        { name: 'Expires At', value: `\`${dbRole.expires_at}\``, inline: true },
                    );
                }

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

            if (!userHasRole) {
                await interaction.guild.members.cache.get(user.id).roles.add(roleID);
            }

            const currentDate = new Date().toUTCString();
            let expiresAt = new Date().toUTCString();
            const addedAt = new Date().toUTCString();

            switch (duration) {
                case '1min':
                    expiresAt = new Date(new Date().getTime() + 60000).toUTCString();
                    break;
                case '1d':
                    expiresAt = new Date(new Date().setDate(new Date().getDate() + 1)).toUTCString();
                    break;
                case '1w':
                    expiresAt = new Date(new Date().setDate(new Date().getDate() + 7)).toUTCString();
                    break;
                case '1m':
                    expiresAt = new Date(new Date().setMonth(new Date().getMonth() + 1)).toUTCString();
                    break;
                default:
                    expiresAt = new Date().toUTCString();
                    break;
            }

            if (!userHasDBRole) {
                addRole(user.id, roleID, currentDate, expiresAt);
            } else {
                const role = getRole(user.id, roleID);
                // console.log(role);
                addedAt = role.added_at;
                expiresAt = new Date(role.expires_at).toUTCString();
            }

            let successDescription = '';

            if (userHasRole) {
                successDescription = `The role was already present on the user profile, but it was not present on the user database, so the role was added to the database with the new duration`;
            }

            if (userHasDBRole) {
                successDescription = `The role was already present on the user database but it was not present on the user profile, so the role was only added to the user profile, the duration was not updated`;
            }

            if (!userHasRole && !userHasDBRole) {
                successDescription = `The role was added to the user profile and the database with the new duration`;
            }

            const successEmbed = simpleEmbed({
                description: `**✅ \u200b Role successfully added to user**\n\n${successDescription}\n\n> **Role Configurations**`,
                color: 'Green'
            }).addFields(
                { name: 'User', value: `<@${user.id}>`, inline: true },
                { name: 'Role', value: `<@&${roleID}>`, inline: true },
                { name: 'Duration', value: `\`${duration}\``, inline: true },
                { name: 'Added At', value: `\`${addedAt}\``, inline: true },
                { name: 'Expires At', value: `\`${expiresAt}\``, inline: true },
            );

            return await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            // console.error(error);
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b An error occurred**\n\n>>> Make sure the bot role is above the role you are trying to add`,
                color: 'Red'
            });
            return await interaction.editReply({ embeds: [errorEmbed] });
        }

    },
};