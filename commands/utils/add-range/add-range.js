const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const {setRange} = require('../../../database/models/discount_range');
const { validateRange } = require('../../../utils/functions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-range')
        .setDescription('Add a discout range and channel to be notified of')
        .addStringOption(option =>
            option.setName('range')
                .setDescription('Discount range to be notified of (e.g. 10-20)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to be notified of this range')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    isAdmin: true,
    async execute(interaction) {

        const range = interaction.options.getString('range');
        const channel = interaction.options.getChannel('channel');
        const channelID = channel.id;

        const isValidRange = validateRange(range);
        
        if (!isValidRange.valid) {
            const errorEmbed = simpleEmbed({
                description: `**❌ The range is not valid**
                
                >>> Please give range in this format: \`xx-xx\`
                for e.g. \`10-20\`, \`50-60\``, color: 'Red' 
            });
            return await interaction.reply({embeds: [errorEmbed]});
        }

        setRange(range, channelID);

        return await interaction.reply({ content: `Range added: ${range}` });

        // const embed = simpleEmbed({ footer: "Config", title: 'Admin changed', color: 'Random' }).addFields(
        //     { name: 'New Admin Role', value: `> <@&${roleID}>`, inline: true },
        // );

        // return await interaction.reply({ embeds: [embed] });

    },
};