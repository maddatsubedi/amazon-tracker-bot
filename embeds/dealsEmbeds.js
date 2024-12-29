const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { priceTypesMap: priceTypesMapKeepa, domain, priceTypesAccesor } = require('../utils/keepa.json');
const { getProductGraphBuffer } = require('../utils/keepaProductApi');
const { config } = require('../utils/keepa.json');
const { formatPrice } = require('../utils/helpers');
const { getAllRanges, getRangeForDiscount } = require('../database/models/discount_range');

const getDealEmbed = async (deal, roleId) => {

    if (!deal) {
        return {
            error: true,
            errorType: 'NO_DATA'
        }
    }

    const flagEmojis = deal.domains.map(domainID => domain[domainID].flagEmoji);

    if (!deal.maxPercentageDropDay.value) {
        return {
            error: true,
            errorType: 'NO_DEAL'
        }
    }

    const maxPriceAccesors = deal.maxPercentageDropDay.priceTypes.map(priceType => priceTypesAccesor[priceType]);
    const maxPriceTypes = deal.maxPercentageDropDay.priceTypes.map(priceType => priceTypesMapKeepa[priceType]);
    const priceTypesString = maxPriceTypes.join(', ');

    // console.log(maxPriceAccesors);
    // console.log(maxPriceTypes);
    // console.log(deal.maxPercentageDropDay);
    // console.log(deal);

    const priceTypesForGraph = {
        amazon: deal.availabePriceTypes.includes(0) ? 1 : 0,
        new: deal.availabePriceTypes.includes(1) ? 1 : 0,
        bb: deal.availabePriceTypes.includes(18) ? 1 : 0,
    }

    const productGraphBuffer = await getProductGraphBuffer({ asin: deal.asin, domain: config.mainDomainId, priceTypes: priceTypesForGraph });
    const productGraphAttachment = productGraphBuffer ? new AttachmentBuilder(productGraphBuffer)
        .setName(`productGraph_${deal.asin}.png`) : null;

    const dealEmbed = new EmbedBuilder()
        .setColor('Random')
        .setThumbnail(deal.image)
        .setTimestamp()
        .setFooter({ text: 'alerte baisse de prix' })
        .setImage(`attachment://${productGraphAttachment?.name}`)
        .setTitle(`Nouveau Deal  :  ${flagEmojis.join(' ')}`)
        .setDescription(`**[${deal.title}](https://www.amazon.fr/dp/${deal.asin})**`)
        .addFields(
            { name: 'Prix actuel', value: `> **${deal[maxPriceAccesors[0]].currentPrice ? formatPrice(deal[maxPriceAccesors[0]].currentPrice, deal.domains[0]) : 'N/A'}**` },
            { name: 'Ancien prix', value: `> **${(deal[maxPriceAccesors[0]].currentPrice && deal[maxPriceAccesors[0]].dropDay) ? formatPrice((deal[maxPriceAccesors[0]].currentPrice + deal[maxPriceAccesors[0]].dropDay), deal.domains[0]) : 'N/A'}**` },
            { name: 'Déduction :arrow_down:', value: `> **${deal[maxPriceAccesors[0]].percentageDropDay ? `${deal[maxPriceAccesors[0]].percentageDropDay} %` : 'N/A'}**` },
            { name: 'Prix réduits', value: `> \`${priceTypesString}\`` }
        )

    const dealButtonRow = new ActionRowBuilder()
        .addComponents(
            ...Object.entries(deal.productUrls).map(([domainID, url]) =>
                new ButtonBuilder()
                    // .setLabel(`${domain[domainID].flagEmoji}`)
                    .setEmoji(domain[domainID].flagEmoji)
                    .setStyle(ButtonStyle.Link)
                    .setURL(url)
            )
        );

    const message = {
        content: `<@&${roleId}>`,
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