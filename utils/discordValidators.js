const { checkRole } = require('../utils/helpers');
const { getConfig } = require('../database/models/config');
const { simpleEmbed } = require('../embeds/generalEmbeds');
const { guildId } = require('../config.json');

const validateAdmin = async (interaction) => {
    const adminRoleID = getConfig('adminRoleID');
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
    if (interaction.guildId !== guildId) {
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
