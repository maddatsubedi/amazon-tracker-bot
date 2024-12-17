const { SlashCommandBuilder } = require('discord.js');
const { getConfig, setConfig, getAllConfigs } = require('../../../database/models/config');
const {setRange, getAllRanges} = require('../../../database/models/discount_range');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		console.log(getAllConfigs());
		console.log(getAllRanges());
		return await interaction.reply('Pong!');
	},
};