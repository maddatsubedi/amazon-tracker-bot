const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { priceTypesMap: priceTypesMapKeepa, domain } = require('./utils/keepa.json');

const data = {
    asin: 'B084RKCJ2F',
    title: 'Ralph Lauren Damen 0ra4004 Sonnenbrille, Dorado, M',
    image: 'https://images-na.ssl-images-amazon.com/images/I/61xKSmuL1PL.jpg',
    creationDate: 'Fri, 27 Dec 2024 21:46:00 GMT',
    categories: [1981676031],
    rootCat: 11961464031,
    lastUpdate: 'Fri, 27 Dec 2024 21:46:00 GMT',
    amazonStat: {
        currentPrice: '€125.76',
        avgDay: '€181.47',
        avgWeek: '€176.59',
        avgMonth: '€146.85',
        percentageDropDay: 30,
        percentageDropWeek: 29,
        percentageDropMonth: 14,
        dropDay: '€55.71',
        dropWeek: '€50.83',
        dropMonth: '€21.09'
    },
    newStat: {
        currentPrice: '€125.76',
        avgDay: '€181.47',
        avgWeek: '€176.59',
        avgMonth: '€146.85',
        percentageDropDay: 20,
        percentageDropWeek: 29,
        percentageDropMonth: 14,
        dropDay: '€55.71',
        dropWeek: '€50.83',
        dropMonth: '€21.09'
    },
    buyBoxStat: {
        currentPrice: '€125.76',
        avgDay: '€181.47',
        avgWeek: '€176.59',
        avgMonth: '€146.85',
        percentageDropDay: 50,
        percentageDropWeek: 29,
        percentageDropMonth: 14,
        dropDay: '€55.71',
        dropWeek: '€50.83',
        dropMonth: '€21.09'
    },
    dealOf: { '3': [0, 1, 18], '4': [0, 1] },
    formattedDealOf: { de: ['Amazon', 'New', 'Buy Box'], fr: ['Amazon', 'New'] },
    productUrls: {
        '3': 'https://www.amazon.de/dp/B084RKCJ2F',
        '4': 'https://www.amazon.fr/dp/B084RKCJ2F'
    },
    domains: ['3', '4'],
    availabePriceTypes: [0, 1, 18],
    priceTypesMap: { '0': 'amazonStat', '1': 'newStat', '18': 'buyBoxStat' },
    maxPercentageDropDay: { value: 50, priceType: 18 }
};

const flagEmojis = data.domains.map(domainID => domain[domainID].flagEmoji);

const testEmbed = new EmbedBuilder()
    .setColor('Random')
    .setThumbnail(data.image)
    .setTimestamp()
    .setImage('https://cdn.discordapp.com/attachments/1322643539229806694/1322643601028681779/productGraph_B084RKCJ2F.png?ex=67719f58&is=67704dd8&hm=4077d8bb3f7547929024caaed0444638501dc974b148052cecdd99ea11bba288&')
    .setTitle(`Nouveau Deal  :  ${flagEmojis.join(' ')}`)
    .setDescription(`**[${data.title}](https://www.amazon.fr/dp/${data.asin})**`)
    .addFields(
        { name: 'Prix actuel', value: `> €125.76` },
        { name: 'Ancien prix', value: `> €174.29` },
        { name: 'Déduction :arrow_down:', value: `> 27.82%` },
    )

const buttonRow = new ActionRowBuilder()
    .addComponents(
        ...Object.entries(data.productUrls).map(([domainID, url]) =>
            new ButtonBuilder()
                // .setLabel(`${domain[domainID].flagEmoji}`)
                .setEmoji(domain[domainID].flagEmoji)
                .setStyle(ButtonStyle.Link)
                .setURL(url)
        )
    );

module.exports = {
    testEmbed,
    buttonRow
}