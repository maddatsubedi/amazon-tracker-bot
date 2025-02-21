const { checkRole } = require('../utils/helpers');
const { getConfig } = require('../database/models/config');
const { simpleEmbed } = require('../embeds/generalEmbeds');
const { guildId } = require('../config.json');
const { getGuildConfig } = require('../database/models/guildConfig');

const validateAdmin = async (interaction) => {
    const guildId = interaction.guild.id;
    const adminRoleID = getGuildConfig(guildId, 'adminRoleID');
    const errorEmbed = simpleEmbed({ description: '⚠️ \u200b You do not have permission to run this command', color: 'Red' });
    const command = interaction.client.commands.get(interaction.commandName);

    if (command.isAdmin && !checkRole(interaction.member, adminRoleID)) {
        return {
            error: true,
            embed: errorEmbed
        };
    }
}

const validateGuild = async (interaction) => {
    const errorEmbed = simpleEmbed({ description: '⚠️ \u200b You cannot use this bot in this server', color: 'Red' });
    const command = interaction.client.commands.get(interaction.commandName);
    if (interaction.guildId !== guildId && !command.otherGuilds?.includes(interaction.guildId)) {
        return {
            error: true,
            embed: errorEmbed
        };
    }
}

const validateAdminAndGuild = async (interaction) => {
    return await validateGuild(interaction) ||
    await validateAdmin(interaction)
}

module.exports = {
    validateAdmin,
    validateGuild,
    validateAdminAndGuild
}
