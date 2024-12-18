const { SlashCommandBuilder } = require('discord.js');
const { getConfig, setConfig, getAllConfigs } = require('../../../database/models/config');
const {setRange, updateRange, getAllRanges, deleteRange} = require('../../../database/models/discount_range');
const db = require('../../../database/db');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		// db.prepare('DROP TABLE IF EXISTS discount_range').run();
		// console.log(getAllConfigs());
		// console.log(getAllRanges());
		// deleteRange('1-2');
		return await interaction.reply('Pong!');
	},
};