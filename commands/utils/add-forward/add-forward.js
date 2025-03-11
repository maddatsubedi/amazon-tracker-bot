const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { addMultiValueGuildConfig, getGuildConfig, getMultiValueGuildConfig } = require('../../../database/models/guildConfig');
const { otherGuilds1 } = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-forward')
        .setDescription('Add a channel forwarding configuration')
        .addChannelOption(option =>
            option.setName('source')
                .setDescription('Source channel in this server')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('destination')
                .setDescription('Destination channel link (can be from another server)')
                .setRequired(true)),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        await interaction.deferReply();

        const sourceChannel = interaction.options.getChannel('source');
        const destinationLink = interaction.options.getString('destination');
        const currentGuild = interaction.guild;

        // Validate source link format
        const linkRegex = /https:\/\/discord\.com\/channels\/(\d+)\/(\d+)/;
        if (!linkRegex.test(destinationLink)) {
            return interaction.editReply({ embeds: [simpleEmbed({ color: 'Red', description: '❌ Invalid destination channel link format!' })] });
        }

        const [, destinationGuildId, destinationChannelId] = destinationLink.match(linkRegex);

        try {
            const destinationGuild = await interaction.client.guilds.fetch(destinationGuildId).catch(() => null);

            const destinationChannel = await destinationGuild?.channels.fetch(destinationChannelId).catch(() => null);

            if (!destinationChannel || destinationChannel.type !== ChannelType.GuildText) {
                const errorEmbed = simpleEmbed({
                    color: 'Red',
                    description: '❌ Destination channel not found or is not a text channel'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            };

            if (sourceChannel.id === destinationChannel.id) {
                const errorEmbed = simpleEmbed({
                    color: 'Red',
                    description: '❌ Destination and destination channels cannot be the same'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const existingForwardConfig = getMultiValueGuildConfig(currentGuild.id, 'forwardConfig', ',');
            if (existingForwardConfig.includes(`${sourceChannel.id}:${destinationGuildId}/${destinationChannelId}`)) {
                const errorEmbed = simpleEmbed({
                    color: 'Red',
                    description: '❌ This forwarding configuration already exists'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const configString = `${sourceChannel.id}:${destinationGuildId}/${destinationChannelId}`;

            const dbResult = addMultiValueGuildConfig(currentGuild.id, 'forwardConfig', configString, ',');

            if (!dbResult) {
                const errorEmbed = simpleEmbed({
                    color: 'Red',
                    description: '❌ Failed to set up forwarding configuration'
                });
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const embed = simpleEmbed({
                title: 'Forwarding Set Up Successfully',
                color: 'Green',
                footer: `${interaction.guild.name} | Config`,
            }).addFields(
                { name: "Source Channel", value: `${sourceChannel.toString()}` },
                { name: "Destination Channel", value: destinationLink }
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Forward Setup Error:', error);
            const errorEmbed = simpleEmbed({
                color: 'Red',
                description: `**❌ Failed to setup forwarding configuration. Please try again later**\n\n>>> Please make sure the source channel link is correct and the bot has access to the source channel.`
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};