const { Events, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getGuildConfig, isPremiumLocked } = require('../../database/models/guildConfig');
const { simpleEmbed } = require('../../embeds/generalEmbeds');
const moment = require('moment-timezone');
const { premiumServerLock } = require('../../utils/discordUtils');

const TICKET_CHANNEL_MESSAGE_DELAY = 3000;

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel) {
        if (!channel.guild) return;

        const guild = channel.guild
        const guildId = guild.id;

        try {

            const serverPremiumLocked = isPremiumLocked(guildId);

            if (serverPremiumLocked) {
                const premiumRoleId = getGuildConfig(guildId, 'premium_role_id');
                await premiumServerLock(guild, premiumRoleId);
            };


        } catch (error) {
            console.log(error);
        }


    },
};
