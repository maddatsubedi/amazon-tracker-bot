const { Events, EmbedBuilder } = require('discord.js');
const { simpleEmbed } = require('../../embeds/generalEmbeds');
const { runMessageForward } = require('./handlers/forward');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        try {
            if (message.author.bot) return;

            runMessageForward(message); // Forward message to another channel

        } catch (error) {
            console.error("An error occurred in messageCreate event: ", error);
        }
    },
};