const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { otherGuilds1 } = require('../../../config.json');
const { addBulkSubscriptionRoles } = require('../../../database/models/subscriptionRoles');
const { setGuildConfig } = require('../../../database/models/guildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-subscriptions-log-channel')
        .setDescription('Set the channel where subscription logs will be sent')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send subscription logs to')
                .setRequired(true)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        const guildId = interaction.guild.id;
        const channelId = interaction.options.getChannel('channel').id;

        setGuildConfig(guildId, 'subscriptions_log_channel_id', channelId);

        const embed = simpleEmbed({footer: `${interaction.guild.name} | Config`, title: 'Subscription Log Channel Changed', color:'Random'}).addFields(
            { name: 'New Channel', value: `> <#${channelId}>` },
        );

        return await interaction.reply({ embeds: [embed] });

    }
}