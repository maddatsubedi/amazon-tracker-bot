const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getRangeDetails } = require('../../../database/models/discount_range');
const { validateRange } = require('../../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-range')
        .setDescription('Add a discout range, channel and role to be notified of')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Discount range to be notified of (e.g. 10-20)')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to be notified of this range')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        const range = interaction.options.getString('range');
        const role = interaction.options.getRole('role');
        const roleID = role.id;

        const isValidRange = validateRange(range);

        if (!isValidRange.valid) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The range is not valid**\n\n>>> Please give range in this format: \`xx-xx\`\nfor e.g. \`10-20\`, \`50-60\``, color: 'Red'
            });
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        const existingRange = getRangeDetails(range);

        if (existingRange) {
            const errorEmbed = simpleEmbed(
                {
                    description: `❌ \u200b **The range \`${range}\` already exists with following configurations**\n\n*Please use \`/update-range\` to update the configurations or use \`/delete-range\` to delete the range and add again*`,
                    color: 'Red',
                }
            ).addFields(
                { name: 'Range', value: `\`${range}\``, inline: true },
                { name: 'Role', value: `<@&${existingRange.roleID}>`, inline: true },
            );
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        setRange(range, roleID);


        // return await interaction.reply({ content: `Range added: ${range}` });

        const embed = simpleEmbed({ title: 'New Range Added', color: 'Green', footer: "Config" }).addFields(
            { name: 'Range', value: `\`${range}\``, inline: true },
            { name: 'Role', value: `<@&${roleID}>`, inline: true },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};