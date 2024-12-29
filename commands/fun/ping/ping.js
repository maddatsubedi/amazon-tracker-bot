const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig, setConfig, getAllConfigs } = require('../../../database/models/config');
const { setRange, updateRange, getAllRanges, deleteRange } = require('../../../database/models/discount_range');
const db = require('../../../database/db');
const { getProductDetails, addProducts } = require('../../../utils/keepaProductApi');
const { getProductsFromStore } = require('../../../utils/rainforestApis');
const { insertBrand } = require('../../../database/models/asins');
const { getDealEmbed } = require('../../../embeds/dealsEmbeds');

const data = {
    asin: 'B0C4LNSMZX',
    title: 'adidas 3S Tc Pt Legink XXL',
    image: 'https://images-na.ssl-images-amazon.com/images/I/71-0QmLu6bL.jpg',
    creationDate: 'Sun, 29 Dec 2024 01:06:00 GMT',
    categories: [26086537031, 3520847031, 27982170031],
    rootCat: 11961464031,
    lastUpdate: 'Sun, 29 Dec 2024 01:06:00 GMT',
    amazonStat: {
        currentPrice: 2750,
        avgDay: 3750,
        avgWeek: 3786,
        avgMonth: 3794,
        percentageDropDay: 27,
        percentageDropWeek: 27,
        percentageDropMonth: 28,
        dropDay: 1000,
        dropWeek: 1036,
        dropMonth: 1044
    },
    newStat: {
        currentPrice: 2750,
        avgDay: 3750,
        avgWeek: 3782,
        avgMonth: 3772,
        percentageDropDay: 27,
        percentageDropWeek: 27,
        percentageDropMonth: 27,
        dropDay: 1000,
        dropWeek: 1032,
        dropMonth: 1022
    },
    buyBoxStat: {
        currentPrice: 2750,
        avgDay: 3750,
        avgWeek: 3786,
        avgMonth: 3794,
        percentageDropDay: 27,
        percentageDropWeek: 27,
        percentageDropMonth: 28,
        dropDay: 1000,
        dropWeek: 1036,
        dropMonth: 1044
    },
    dealOf: { '3': [0, 1, 18] },
    formattedDealOf: { de: ['Amazon', 'New', 'Buy Box'] },
    productUrls: { '3': 'https://www.amazon.de/dp/B0C4LNSMZX' },
    domains: ['3'],
    availabePriceTypes: [0, 1, 18],
    maxPercentageDropDay: { value: 27, priceTypes: [0, 1, 18] }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.deferReply();

		const dealEmbed = await getDealEmbed(data);

		await interaction.channel.send(dealEmbed);
		return await interaction.editReply('Pong!');
	},
};