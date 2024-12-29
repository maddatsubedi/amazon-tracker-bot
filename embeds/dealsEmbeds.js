const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { priceTypesMap: priceTypesMapKeepa, domain, priceTypesAccesor } = require('../utils/keepa.json');
const { getProductGraphBuffer } = require('../utils/keepaProductApi');
const { config } = require('../utils/keepa.json');
const { formatPrice } = require('../utils/helpers');
const { getAllRanges, getRangeForDiscount } = require('../database/models/discount_range');

const getDealEmbed = async (data) => {

    if (!data) {
        return {
            error: true,
            errorType: 'NO_DATA'
        }
    }

    const flagEmojis = data.domains.map(domainID => domain[domainID].flagEmoji);

    if (!data.maxPercentageDropDay.value) {
        return {
            error: true,
            errorType: 'NO_DEAL'
        }
    }

    const maxPriceAccesors = data.maxPercentageDropDay.priceTypes.map(priceType => priceTypesAccesor[priceType]);
    const maxPriceTypes = data.maxPercentageDropDay.priceTypes.map(priceType => priceTypesMapKeepa[priceType]);
    const priceTypesString = maxPriceTypes.join(', ');

    // console.log(maxPriceAccesors);
    // console.log(maxPriceTypes);
    // console.log(data.maxPercentageDropDay);
    // console.log(data);

    const priceTypesForGraph = {
        amazon: data.availabePriceTypes.includes(0) ? 1 : 0,
        new: data.availabePriceTypes.includes(1) ? 1 : 0,
        bb: data.availabePriceTypes.includes(18) ? 1 : 0,
    }

    const productGraphBuffer = await getProductGraphBuffer({ asin: data.asin, domain: config.mainDomainId, priceTypes: priceTypesForGraph });
    const productGraphAttachment = productGraphBuffer ? new AttachmentBuilder(productGraphBuffer)
        .setName(`productGraph_${data.asin}.png`) : null;

    const dealEmbed = new EmbedBuilder()
        .setColor('Random')
        .setThumbnail(data.image)
        .setTimestamp()
        .setFooter({ text: 'alerte baisse de prix' })
        .setImage(`attachment://${productGraphAttachment?.name}`)
        .setTitle(`Nouveau Deal  :  ${flagEmojis.join(' ')}`)
        .setDescription(`**[${data.title}](https://www.amazon.fr/dp/${data.asin})**`)
        .addFields(
            { name: 'Prix actuel', value: `> **${data[maxPriceAccesors[0]].currentPrice ? formatPrice(data[maxPriceAccesors[0]].currentPrice, data.domains[0]) : 'N/A'}**` },
            { name: 'Ancien prix', value: `> **${(data[maxPriceAccesors[0]].currentPrice && data[maxPriceAccesors[0]].dropDay) ? formatPrice((data[maxPriceAccesors[0]].currentPrice + data[maxPriceAccesors[0]].dropDay), data.domains[0]) : 'N/A'}**` },
            { name: 'Déduction :arrow_down:', value: `> **${data[maxPriceAccesors[0]].percentageDropDay ? `${data[maxPriceAccesors[0]].percentageDropDay} %` : 'N/A'}**` },
            { name: 'Prix réduits', value: `> \`${priceTypesString}\`` }
        )

    const dealButtonRow = new ActionRowBuilder()
        .addComponents(
            ...Object.entries(data.productUrls).map(([domainID, url]) =>
                new ButtonBuilder()
                    // .setLabel(`${domain[domainID].flagEmoji}`)
                    .setEmoji(domain[domainID].flagEmoji)
                    .setStyle(ButtonStyle.Link)
                    .setURL(url)
            )
        );

    const range = await getRangeForDiscount(data[maxPriceAccesors[0]].percentageDropDay);

    if (!range) {
        return {
            error: true,
            errorType: 'NO_RANGE_CONFIGURED'
        }
    }

    const message = {
        content: `<@&${range.roleID}>`,
        embeds: [dealEmbed],
        components: [dealButtonRow]
    }

    if (productGraphAttachment) {
        message.files = [productGraphAttachment];
    }

    return message;

}

module.exports = {
    getDealEmbed
}