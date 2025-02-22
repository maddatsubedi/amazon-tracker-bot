const { Events } = require('discord.js');
const { initPolling } = require('../../tracking/polling');
const { setIsPolling, unsetIsPolling } = require('../../database/models/config');
const { setupBotInit } = require('../../utils/setupBotInit');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		setupBotInit(client); // Setup the bot with the necessary configurations
	},
};