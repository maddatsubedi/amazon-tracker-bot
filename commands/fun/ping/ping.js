const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig, setConfig, getAllConfigs } = require('../../../database/models/config');
const { setRange, updateRange, getAllRanges, deleteRange } = require('../../../database/models/discount_range');
const db = require('../../../database/db');
const { getProductDetails, addProducts } = require('../../../utils/keepaApis');
const { getProductsFromStore } = require('../../../utils/rainforestApis');
const { insertBrand } = require('../../../database/models/asins');
const { testEmbed, buttonRow } = require('../../../test2');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.deferReply();

		return await interaction.editReply({ embeds: [testEmbed], components: [buttonRow] });
		// return await interaction.editReply('Pong!');
	},
};