const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { updateRange, getChannelAndRole } = require('../../../database/models/discount_range');
const { validateRange } = require('../../../utils/functions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-range')
        .setDescription('Update the channel or role for an existing discount range')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Discount range to update (e.g. 10-20)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('New channel to be notified of this range')
                .addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('New role to be notified of this range')),
    isAdmin: true,
    async execute(interaction) {
        const range = interaction.options.getString('range');
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');

        const isValidRange = validateRange(range);

        if (!isValidRange.valid) {
            const errorEmbed = simpleEmbed({
                description: `**❌ The range is not valid**
                
                >>> Please give range in this format: \`xx-xx\`
                for e.g. \`10-20\`, \`50-60\``, color: 'Red'
            });
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        const existingRange = getChannelAndRole(range);

        if (!existingRange) {
            const errorEmbed = simpleEmbed({
                description: `❌ **The range \`${range}\` does not exist**`,
                color: 'Red',
            });
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        const { channelID: oldChannelID, roleID: oldRoleID } = existingRange;

        const newChannelID = channel ? channel.id : oldChannelID;
        const newRoleID = role ? role.id : oldRoleID;

        updateRange(range, newChannelID, newRoleID);

        const successEmbed = simpleEmbed({
            title: `Range \`${range}\` Updated`, color: 'Green', footer: 'Config',
            description: `**Old Configurations**
            > \`Channel\`: <#${oldChannelID}>
            > \`Role\`: <@&${oldRoleID}>
            
            **New Configurations**
            > \`Channel\`: <#${newChannelID}>
            > \`Role\`: <@&${newRoleID}>`,
        });

        return await interaction.reply({ embeds: [successEmbed] });
    },
};
