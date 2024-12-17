const { SlashCommandBuilder } = require('discord.js');
const { getConfig, setConfig } = require('../../../database/models/config');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		// await interaction.reply(`Prefix is ${getConfig('prefix')}`);
		return await interaction.reply('Pong!');
	},
};