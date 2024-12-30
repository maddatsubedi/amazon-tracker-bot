const { Events } = require('discord.js');
const { initPolling } = require('../../tracking/polling');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		initPolling(client);
	},
};