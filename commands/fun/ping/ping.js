const { SlashCommandBuilder } = require('discord.js');
const { getConfig, setConfig, getAllConfigs } = require('../../../database/models/config');
const { setRange, updateRange, getAllRanges, deleteRange } = require('../../../database/models/discount_range');
const db = require('../../../database/db');
const { getProductDetails, getProducts } = require('../../../utils/keepaApis');
const { getProductsFromStore } = require('../../../utils/rainforestApis');
const { insertBrand } = require('../../../database/models/asins');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.deferReply();
		// db.prepare('DROP TABLE IF EXISTS discount_range').run();
		// console.log(getAllConfigs());
		// console.log(getAllRanges());
		// deleteRange('1-2');
		// const product = await getProductDetails({asin: 'B07682XJLF'});
		// console.log(product);
		const products = await getProducts({});
		// await insertBrand('adsf', 'dfs,fds');
		products && console.log(products);
		// console.log(products);
		return await interaction.editReply('Pong!');
	},
};