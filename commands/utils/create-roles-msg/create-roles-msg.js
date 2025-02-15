const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-roles-msg')
        .setDescription('Create Message Embed for Roles')
        .addStringOption(option =>
            option.setName('template-message-link')
                .setDescription('Message link to use as template')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send the message')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    isAdmin: true,
    async execute(interaction) {
        try {
            await interaction.deferReply();

            // Configuration
            const MAX_BUTTONS_PER_ROW = 5;
            const EMBED_COLOR = 'Blue';
            const EMBED_FOOTER = 'Button Roles';

            // Get command inputs
            const messageLink = interaction.options.getString('template-message-link');
            const sendChannel = interaction.options.getChannel('channel');

            // Validate message link format
            const linkMatch = messageLink.match(/^https:\/\/(?:www\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
            if (!linkMatch) {
                return interaction.editReply({ embeds: [simpleEmbed({ description: '**Invalid message link format**', color: 'Red' })] });
            }

            const [_, linkGuildId, channelId, messageId] = linkMatch;
            if (linkGuildId !== interaction.guildId) {
                return interaction.editReply({ embeds: [simpleEmbed({ description: '**Message link must be from this server**', color: 'Red' })] });
            }

            // Fetch template message
            const templateChannel = await interaction.guild.channels.fetch(channelId);
            const templateMessage = await templateChannel.messages.fetch(messageId);

            // Parse categories from template
            const categories = [];
            const roleMentionRegex = /<@&(\d+)>/g;

            templateMessage.content.split('\n\n').forEach(section => {
                const lines = section.split('\n').filter(l => l.trim());
                if (lines.length < 2) return;

                const [titleLine, ...roleLines] = lines;
                const [title, ...descriptionParts] = titleLine.split(':').map(p => p.trim());
                const description = descriptionParts.join(': ');

                const roles = [];
                roleLines.join(' ').match(roleMentionRegex)?.forEach(mention => {
                    const roleId = mention.replace(/<@&|>/g, '');
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (role) roles.push(role);
                });

                if (title && roles.length > 0) {
                    categories.push({
                        title: title,
                        description: description || ' ',
                        roles: roles
                    });
                }
            });

            // Build embed description
            let embedDescription = '';
            const allActionRows = [];

            for (const category of categories) {
                // Add category section to embed
                embedDescription += `> **${category.title}**\n> ${category.description}\n`;
                embedDescription += `> • ${category.roles.map(role => `${role.toString()}`).join('\n> • ')}\n\n`;

                // Create buttons for this category
                const categoryButtons = category.roles.map(role =>
                    new ButtonBuilder()
                        .setCustomId(`button_role:${role.id}`)
                        .setLabel(role.name)
                        .setStyle(ButtonStyle.Primary)
                );

                // Split buttons into rows
                while (categoryButtons.length > 0) {
                    const rowButtons = categoryButtons.splice(0, MAX_BUTTONS_PER_ROW);
                    allActionRows.push(new ActionRowBuilder().addComponents(rowButtons));
                }
            }

            // Create final embed
            const roleEmbed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setDescription(embedDescription.trim())
                .setFooter({ text: EMBED_FOOTER });

            // Send message with components
            await sendChannel.send({
                embeds: [roleEmbed],
                components: allActionRows
            });

            return interaction.editReply({
                embeds: [simpleEmbed({ description: `**Button roles message created in ${sendChannel}**`, color: 'Green' })]
            });

        } catch (error) {
            console.error('Create Roles Message Error:', error);
            return interaction.editReply({
                embeds: [simpleEmbed({ description: '**Failed to create roles message**', color: 'Red' })]
            });
        }
    }
};