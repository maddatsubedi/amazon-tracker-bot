const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getConfig, setConfig, getAllConfigs } = require('../../../database/models/config');
const { setRange, updateRange, getAllRanges, deleteRange } = require('../../../database/models/discount_range');
const db = require('../../../database/db');
const { getProductDetails, addProducts } = require('../../../utils/keepaProductApi');
const { getProductsFromStore } = require('../../../utils/rainforestApis');
const { insertBrand } = require('../../../database/models/asins');
const { getDealMessage } = require('../../../embeds/dealsMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        await interaction.deferReply();

        // await interaction.channel.send('');
        return await interaction.editReply('Pong!');
    },
};