const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { setRange, getChannelAndRole } = require('../../../database/models/discount_range');
const { validateRange } = require('../../../utils/functions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-range')
        .setDescription('Add a discout range, channel and role to be notified of')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Discount range to be notified of (e.g. 10-20)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to be notified of this range')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to be notified of this range')
                .setRequired(true)),
    isAdmin: true,
    async execute(interaction) {

        const range = interaction.options.getString('range');
        const channel = interaction.options.getChannel('channel');
        const role = interaction.options.getRole('role');
        const channelID = channel.id;
        const roleID = role.id;

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

        if (existingRange) {
            const errorEmbed = simpleEmbed(
                {
                    description: `❌ **The range \`${range}\` already exists with following configurations**
                    
                    *Please use \`/update-range\` to update the configurations or use \`/delete-range\` to delete the range and add again*`,
                    color: 'Red',
                }
            ).addFields(
                { name: 'Range', value: `\`${range}\``, inline: true },
                { name: 'Channel', value: `<#${channelID}>`, inline: true },
                { name: 'Role', value: `<@&${roleID}>`, inline: true },
            );
            return await interaction.reply({ embeds: [errorEmbed] });
        }

        setRange(range, channelID, roleID);


        // return await interaction.reply({ content: `Range added: ${range}` });

        const embed = simpleEmbed({ title: 'New Range Added', color: 'Green', footer: "Config" }).addFields(
            { name: 'Range', value: `\`${range}\``, inline: true },
            { name: 'Channel', value: `<#${channelID}>`, inline: true },
            { name: 'Role', value: `<@&${roleID}>`, inline: true },
        );

        return await interaction.reply({ embeds: [embed] });

    },
};