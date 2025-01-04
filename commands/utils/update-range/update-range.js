const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { updateRange, getRangeDetails } = require('../../../database/models/discount_range');
const { validateRange } = require('../../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-range')
        .setDescription('Update the channel or role for an existing discount range')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Discount range to update (e.g. 10-20)')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('New role to be notified of this range')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {
        const range = interaction.options.getString('range');
        const role = interaction.options.getRole('role');

        const isValidRange = validateRange(range);

        if (!isValidRange.valid) {
            const errorEmbed = simpleEmbed({
                description: `**❌ \u200b The range is not valid**\n\n>>> Please give range in this format: \`xx-xx\`\nfor e.g. \`10-20\`, \`50-60\``, color: 'Red'
            });
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        const existingRange = getRangeDetails(range);

        if (!existingRange) {
            const errorEmbed = simpleEmbed({
                description: `❌ \u200b **The range \`${range}\` does not exist**`,
                color: 'Red',
            });
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        const { roleID: oldRoleID } = existingRange;

        const newRoleID = role.id;

        updateRange(range, newRoleID);

        const successEmbed = simpleEmbed({
            title: `Range \`${range}\` Updated`, color: 'Green', footer: 'Config',
            description: `**Old Configurations**\n> \`Role\`: <@&${oldRoleID}>\n\n**New Configurations**\n> \`Role\`: <@&${newRoleID}>`,
        });

        return await interaction.reply({ embeds: [successEmbed] });
    },
};
