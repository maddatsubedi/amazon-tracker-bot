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
            const EMBED_FOOTER = `${interaction.guild.name} | Roles Selection`;

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

            // Split message into sections and separate header from categories
            const sections = templateMessage.content.split('\n\n').map(section => section.trim()).filter(section => section !== '');
            let headerSections = [];
            let categorySections = [];
            let foundFirstCategory = false;
            const roleMentionRegex = /<@&(\d+)>/g;

            for (const section of sections) {
                if (foundFirstCategory) {
                    categorySections.push(section);
                    continue;
                }

                const lines = section.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    headerSections.push(section);
                    continue;
                }

                // Check if the section contains role mentions in the role lines (lines after the first)
                const roleLines = lines.slice(1).join(' ');
                const hasRoleMentions = roleMentionRegex.test(roleLines);
                roleMentionRegex.lastIndex = 0; // Reset regex state after test

                if (hasRoleMentions) {
                    foundFirstCategory = true;
                    categorySections.push(section);
                } else {
                    headerSections.push(section);
                }
            }

            // Extract mainTitle and mainDesc from header sections
            const headerText = headerSections.join('\n\n');
            const mainTitleMatch = headerText.match(/\((.*?)\)/s);
            const mainTitle = mainTitleMatch?.[1]?.trim() || null;
            const mainDescMatch = headerText.match(/\[(.*?)\]/s);
            const mainDesc = mainDescMatch?.[1]?.trim() || null;

            // Parse categories from category sections
            const categories = [];
            categorySections.forEach(section => {
                const lines = section.split('\n').filter(line => line.trim());
                if (lines.length < 2) return;

                const [titleLine, ...roleLines] = lines;
                const [title, ...descriptionParts] = titleLine.split(':').map(part => part.trim());
                const description = descriptionParts.join(': ');

                const roles = [];
                const roleText = roleLines.join(' ');
                const mentions = roleText.match(roleMentionRegex) || [];
                mentions.forEach(mention => {
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
                        .setTitle(mainTitle || DEFAULT_EMBED_TITLE)
                        .setDescription(mainDesc || null);

                    await sendChannel.send({ embeds: [firstEmbed] });
                    totalMessages++;
                }

                for (const category of categories) {
                    let categoryDescription = `> **${category.title}**\n`;
                    if (category.description.trim() !== '') {
                        categoryDescription += `> ${category.description}\n\n`;
                    }
                    categoryDescription += `> **Roles:**`;

                    const categoryEmbed = new EmbedBuilder()
                        .setColor(EMBED_COLOR)
                        .setDescription(categoryDescription);

                    const buttons = category.roles.map(role =>
                        new ButtonBuilder()
                            .setCustomId(`button_role:${role.id}`)
                            .setLabel(role.name)
                            .setStyle(ButtonStyle.Primary)
                    );

                    const categoryActionRows = [];
                    while (buttons.length > 0) {
                        const rowButtons = buttons.splice(0, MAX_BUTTONS_PER_ROW);
                        categoryActionRows.push(new ActionRowBuilder().addComponents(rowButtons));
                    }

                    const rowChunks = [];
                    while (categoryActionRows.length > 0) {
                        rowChunks.push(categoryActionRows.splice(0, MAX_ROWS_PER_MESSAGE));
                    }

                    totalMessages += rowChunks.length;

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
                const roleEmbed = new EmbedBuilder()
                    .setColor(EMBED_COLOR)
                    .setFooter({ text: EMBED_FOOTER, iconURL: interaction.guild.iconURL() });

                let embedDescription = mainDesc ? `${mainDesc}\n\n` : '';
                const allActionRows = [];

                for (const category of categories) {
                    const description = category.description.trim() ? `> ${category.description.trim()}\n` : '';
                    embedDescription += `> **${category.title}**\n${description}`;
                    embedDescription += `> - ${category.roles.map(role => role.toString()).join('\n> - ')}\n\n`;

                    const buttons = category.roles.map(role =>
                        new ButtonBuilder()
                            .setCustomId(`button_role:${role.id}`)
                            .setLabel(role.name)
                            .setStyle(ButtonStyle.Primary)
                    );

                    while (buttons.length > 0) {
                        const rowButtons = buttons.splice(0, MAX_BUTTONS_PER_ROW);
                        allActionRows.push(new ActionRowBuilder().addComponents(rowButtons));
                    }
                }

                if (formatOption === 'format') {
                    roleEmbed.setTitle(mainTitle || DEFAULT_EMBED_TITLE);
                    roleEmbed.setDescription(embedDescription.trim());
                } else {
                    // roleEmbed.setTitle(DEFAULT_EMBED_TITLE);
                    roleEmbed.setDescription(templateMessage.content);
                }

                const componentChunks = [];
                while (allActionRows.length > 0) {
                    componentChunks.push(allActionRows.splice(0, MAX_ROWS_PER_MESSAGE));
                }

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