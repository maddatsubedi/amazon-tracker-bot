const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { simpleEmbed } = require('../../../embeds/generalEmbeds');
const { otherGuilds1 } = require('../../../config.json');
const { generateRandomHexColor } = require('../../../utils/helpers');

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
                .addChannelTypes(ChannelType.GuildText))
        .addStringOption(option =>
            option.setName('format')
                .setDescription('Formatting option (Default: No Format)')
                .setRequired(false)
                .addChoices(
                    { name: 'Format', value: 'format' },
                    { name: 'Plain', value: 'plain' },
                    { name: 'Divide', value: 'divide' }
                )),
    isAdmin: true,
    otherGuilds: otherGuilds1,
    async execute(interaction) {
        try {
            await interaction.deferReply();

            // Constants
            const MAX_BUTTONS_PER_ROW = 5;
            const MAX_ROWS_PER_MESSAGE = 5;
            const EMBED_COLOR = generateRandomHexColor();
            const DEFAULT_EMBED_TITLE = 'Role Selection';
            const EMBED_FOOTER = `${interaction.guild.name} | Roles`;

            // Get inputs
            const messageLink = interaction.options.getString('template-message-link');
            const sendChannel = interaction.options.getChannel('channel');
            const formatOption = interaction.options.getString('format') || 'plain';

            // Validate message link
            const linkMatch = messageLink.match(/^https:\/\/(?:www\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
            if (!linkMatch) {
                return interaction.editReply({ embeds: [simpleEmbed({ description: '**Invalid message link format**', color: 'Red' })] });
            }

            const [_, linkGuildId, channelId, messageId] = linkMatch;
            if (linkGuildId !== interaction.guildId) {
                return interaction.editReply({ embeds: [simpleEmbed({ description: '**Message link must be from this server**', color: 'Red' })] });
            }

            // Fetch template message
            const templateChannel = await interaction.guild.channels.fetch(channelId).catch(() => null);
            if (!templateChannel || templateChannel.type !== ChannelType.GuildText) {
                return interaction.editReply({ embeds: [simpleEmbed({ description: '**Invalid template channel**', color: 'Red' })] });
            }

            const templateMessage = await templateChannel.messages.fetch(messageId).catch(() => null);
            if (!templateMessage) {
                return interaction.editReply({ embeds: [simpleEmbed({ description: '**Invalid template message**', color: 'Red' })] });
            }

            const messageContent = templateMessage.content.trim();

            // Extract main title from template message: (Main Title)
            const mainTitleMatch = messageContent.match(/\((.*?)\)/s);
            const mainTitle = mainTitleMatch?.[1].trim();

            // Extract main description from template message
            const mainDescMatch = messageContent.match(/\[(.*?)\]/s);
            const mainDesc = mainDescMatch?.[1].trim();

            // Parse categories
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

            if (categories.length === 0) {
                return interaction.editReply({ embeds: [simpleEmbed({ description: '**No valid categories found in template message**', color: 'Red' })] });
            }

            // Handle different format options
            if (formatOption === 'divide') {
                let totalMessages = 0;

                if (mainTitle || mainDesc) {

                    const firstEmbed = new EmbedBuilder()
                        .setColor(EMBED_COLOR)

                    mainTitle && firstEmbed.setTitle(mainTitle);
                    mainDesc && firstEmbed.setDescription(mainDesc);

                    await sendChannel.send({ embeds: [firstEmbed] });
                    totalMessages++;
                }

                for (const category of categories) {
                    // Build category embed
                    let categoryDescription = `> **${category.title}**\n`;
                    if (category.description.trim() !== '') {
                        categoryDescription += `> ${category.description}\n\n`;
                    }
                    // categoryDescription += `> - ${category.roles.map(role => role.toString()).join('\n> - ')}`;
                    categoryDescription += `> **Roles:**`;

                    const categoryEmbed = new EmbedBuilder()
                        .setColor(EMBED_COLOR)
                        // .setTitle(DEFAULT_EMBED_TITLE)
                        .setDescription(categoryDescription)
                    // .setFooter({ text: EMBED_FOOTER, iconURL: interaction.guild.iconURL() });

                    // Create buttons
                    const buttons = category.roles.map(role =>
                        new ButtonBuilder()
                            .setCustomId(`button_role:${role.id}`)
                            .setLabel(role.name)
                            .setStyle(ButtonStyle.Primary)
                    );

                    // Split buttons into rows
                    const categoryActionRows = [];
                    while (buttons.length > 0) {
                        const rowButtons = buttons.splice(0, MAX_BUTTONS_PER_ROW);
                        categoryActionRows.push(new ActionRowBuilder().addComponents(rowButtons));
                    }

                    // Split into message chunks
                    const rowChunks = [];
                    while (categoryActionRows.length > 0) {
                        rowChunks.push(categoryActionRows.splice(0, MAX_ROWS_PER_MESSAGE));
                    }

                    totalMessages += rowChunks.length;

                    // Send messages for this category
                    for (const [index, chunk] of rowChunks.entries()) {
                        const messageContent = index === 0 ? { embeds: [categoryEmbed] } : {};
                        await sendChannel.send({
                            ...messageContent,
                            components: chunk
                        });
                    }
                }

                return interaction.editReply({
                    embeds: [simpleEmbed({ description: `**Created ${totalMessages} role messages in ${sendChannel}**`, color: 'Green' })]
                });
            } else {
                // Build combined embed
                const roleEmbed = new EmbedBuilder()
                    .setColor(EMBED_COLOR)
                    .setTitle(mainTitle || DEFAULT_EMBED_TITLE)
                    .setFooter({ text: EMBED_FOOTER, iconURL: interaction.guild.iconURL() });

                let embedDescription = mainDesc ? `${mainDesc}\n\n` : '';
                const allActionRows = [];

                for (const category of categories) {
                    const description = category.description.trim() ? `> ${category.description.trim()}\n` : '';
                    embedDescription += `> **${category.title}**\n${description}`;
                    embedDescription += `> - ${category.roles.map(role => role.toString()).join('\n> - ')}\n\n`;

                    // Create buttons
                    const buttons = category.roles.map(role =>
                        new ButtonBuilder()
                            .setCustomId(`button_role:${role.id}`)
                            .setLabel(role.name)
                            .setStyle(ButtonStyle.Primary)
                    );

                    // Split buttons into rows
                    while (buttons.length > 0) {
                        const rowButtons = buttons.splice(0, MAX_BUTTONS_PER_ROW);
                        allActionRows.push(new ActionRowBuilder().addComponents(rowButtons));
                    }
                }

                // Set embed description based on format
                if (formatOption === 'format') {
                    roleEmbed.setDescription(embedDescription.trim());
                } else {
                    roleEmbed.setDescription(messageContent);
                }

                // Split into component chunks
                const componentChunks = [];
                while (allActionRows.length > 0) {
                    componentChunks.push(allActionRows.splice(0, MAX_ROWS_PER_MESSAGE));
                }

                // Send messages
                for (const [index, chunk] of componentChunks.entries()) {
                    const messageContent = index === 0 ? { embeds: [roleEmbed] } : {};
                    await sendChannel.send({
                        ...messageContent,
                        components: chunk
                    });
                }

                return interaction.editReply({
                    embeds: [simpleEmbed({ description: `**Created ${componentChunks.length} role messages in ${sendChannel}**`, color: 'Green' })]
                });
            }
        } catch (error) {
            console.error('Create Roles Message Error:', error);
            return interaction.editReply({
                embeds: [simpleEmbed({ description: '**Failed to create roles message**', color: 'Red' })]
            });
        }
    }
};