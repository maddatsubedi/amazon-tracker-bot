const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags, } = require("discord.js");
const { generateRandomHexColor } = require("../../../utils/helpers");
const { getConfig } = require("../../../database/models/config");
const { simpleEmbed } = require("../../../embeds/generalEmbeds");
const { getGuildConfig } = require("../../../database/models/guildConfig");
const { otherGuilds1 } = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays the list of commands with pagination."),
    otherGuilds: otherGuilds1,
    async execute(interaction) {

        await interaction.deferReply();

        const guildId = interaction.guild.id;
        const guildName = interaction.guild.name;

        try {

            const PREFIX = getGuildConfig(guildId, "prefix") || getConfig("prefix");

            const slashCommands = interaction.client.commands?.map((cmd) => ({
                name: `/${cmd.data.name}`,
                description: cmd.data.description,
                usage: `\`/${cmd.data.name} ${cmd.data.options
                    ? cmd.data.options
                        .map((opt) =>
                            opt.required
                                ? `<${opt.name}>`
                                : `<${opt.name} (optional)>`
                        )
                        .join(" ")
                    : ""
                    }\``.trim(),
                isAdmin: cmd.isAdmin,
                isOwner: cmd.isOwner,
            }));

            const messageCommands = interaction.client.messageCommands?.map((cmd) => ({
                name: `${PREFIX}${cmd.name}`,
                description: cmd.description,
                usage: `\`${PREFIX}${cmd.name} ${cmd.args
                    ? cmd.args
                        .map((arg) =>
                            arg.required
                                ? `<${arg.name}>`
                                : `<${arg.name} (optional)>`
                        )
                        .join(" ")
                    : ""
                    }\``.trim(),
                isAdmin: cmd.isAdmin,
                isOwner: cmd.isOwner,
            }));

            const slashAndMsgAvailable = slashCommands && messageCommands;

            let currentPage = 0;
            let currentType = "slash"; // "slash" or "message"
            const commandsPerPage = 5;
            const randomHex = generateRandomHexColor();

            // Function to create embeds
            const createEmbed = () => {
                const commands = currentType === "slash" ? slashCommands : messageCommands;
                const totalCommands = commands.length;
                const totalPages = Math.ceil(commands.length / commandsPerPage);

                const paginatedCommands = commands.slice(
                    currentPage * commandsPerPage,
                    (currentPage + 1) * commandsPerPage
                );

                const embed = new EmbedBuilder()
                    .setTitle("Commands Help")
                    .setColor(randomHex)
                    .setDescription(
                        `>>> \`\`\`Displaying ${currentType === "slash" ? "slash" : "message"} commands\n` +
                        `Total ${currentType} commands: ${totalCommands}\n` +
                        `${currentType === "slash" ? "" : `Prefix: ${PREFIX}\n`}\`\`\``
                    )
                    .setFooter({
                        text: slashAndMsgAvailable ? `Page ${currentPage + 1} of ${totalPages}` : `${guildName} | Commands`,
                    });

                paginatedCommands.forEach((cmd) => {
                    const perm = cmd.isOwner ? "Owner" : cmd.isAdmin ? "Admin" : "User";
                    embed.addFields({
                        name: `> **${cmd.name}**`,
                        value: `>>> **Description:** ${cmd.description}\n**Usage:** ${cmd.usage}\n**Permission:** ${perm}`,
                    });
                });

                return embed;
            };

            // Buttons
            const createButtons = () => {
                const actionRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("prev")
                        .setLabel("Previous")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                );

                if (slashAndMsgAvailable) {
                    actionRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId("toggle")
                            .setLabel("Toggle")
                            .setStyle(ButtonStyle.Secondary)
                    );
                } else {
                    const totalPages = Math.ceil(
                        (currentType === "slash"
                            ? slashCommands
                            : messageCommands
                        ).length / commandsPerPage
                    );
                    actionRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId('pagination_info')
                            .setLabel(`Page ${currentPage + 1} / ${totalPages}`)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                    );
                }

                actionRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setLabel("Next")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(
                            currentPage >=
                            Math.ceil(
                                (currentType === "slash"
                                    ? slashCommands
                                    : messageCommands
                                ).length / commandsPerPage
                            ) - 1
                        )
                );

                return actionRow;
            };

            // Initial reply
            const message = await interaction.editReply({
                embeds: [createEmbed()],
                components: [createButtons()],
                fetchReply: true,
            });

            // Collector
            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60000, // 1 minute
            });

            collector.on("collect", async (btnInteraction) => {
                if (btnInteraction.user.id !== interaction.user.id) {
                    const errorEmbed = simpleEmbed({
                        description: "You cannot interact with this button.",
                        color: "Red",
                    });
                    return btnInteraction.reply({ embeds: [errorEmbed] });
                }

                switch (btnInteraction.customId) {
                    case "prev":
                        currentPage = Math.max(0, currentPage - 1);
                        break;
                    case "next":
                        currentPage = Math.min(
                            currentPage + 1,
                            Math.ceil(
                                (currentType === "slash"
                                    ? slashCommands
                                    : messageCommands
                                ).length / commandsPerPage
                            ) - 1
                        );
                        break;
                    case "toggle":
                        currentType = currentType === "slash" ? "message" : "slash";
                        currentPage = 0; // Reset to the first page on toggle
                        break;
                }

                await btnInteraction.update({
                    embeds: [createEmbed()],
                    components: [createButtons()],
                });
            });

            collector.on("end", async () => {
                await message.edit({
                    components: [],
                }).catch((error) => console.log(error.message));
            });

        } catch (err) {
            console.error(err);
            const errorEmbed = simpleEmbed({
                description: "An error occurred while executing this command.",
                color: "Red"
            });
            return interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
