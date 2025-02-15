const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder, PermissionsBitField, ChannelType, PermissionFlagsBits } = require('discord.js');
const { priceTypesMap: priceTypesMapKeepa, domain, priceTypesAccesor } = require('../utils/keepa.json');
const { getProductGraphBuffer, getProductDetailsGeneral } = require('../utils/keepaProductApi');
const { config } = require('../utils/keepa.json');
const { formatPrice } = require('../utils/helpers');
const { getAllRanges, getRangeForDiscount } = require('../database/models/discount_range');
// const { checkDealEffectiveness } = require('../test');


const checkDealEffectiveness = (dropDays, dropWeeks, dropMonths) => {
    const averageDropDays = dropDays.reduce((acc, dropDay) => acc + dropDay) / dropDays.length;
    const averageDropWeeks = dropWeeks.reduce((acc, dropWeek) => acc + dropWeek) / dropWeeks.length;
    const averageDropMonths = dropMonths.reduce((acc, dropMonth) => acc + dropMonth) / dropMonths.length;

    return {
        averageDropDays,
        averageDropWeeks,
        averageDropMonths
    }
}

const getDealMessage = async (deal, roleId, dealAnalysis) => {

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

    const productDetails = await getProductDetailsGeneral(deal.asin, deal.domains[0]);

    const maxPriceAccesors = deal.maxPriceAccesors;
    const maxPriceTypes = deal.maxPercentageDropDay.priceTypes.map(priceType => priceTypesMapKeepa[priceType]); // This will get data from the price types that has the drop percentage day same to maximum drop percentage day
    const maxPriceTypesString = maxPriceTypes.join(', ');
    const maxPriceTypesDealOf = deal.availabePriceTypes.map(priceType => priceTypesMapKeepa[priceType]); // This will get data from the dealOf object of the deal
    const maxPriceTypesDealOfString = maxPriceTypesDealOf.join(', ');

    const priceTypesForGraph = {
        amazon: deal.availabePriceTypes.includes(0) ? 1 : 0,
        new: deal.availabePriceTypes.includes(1) ? 1 : 0,
        bb: deal.availabePriceTypes.includes(18) ? 1 : 0,
    } // This will get data from the dealOf object of the deal

    const productGraphBuffer = await getProductGraphBuffer({ asin: deal.asin, domain: deal.domains[0], priceTypes: priceTypesForGraph });
    const productGraphAttachment = productGraphBuffer ? new AttachmentBuilder(productGraphBuffer)
        .setName(`productGraph_${deal.asin}.png`) : null;

    const currentPrice = deal[maxPriceAccesors[0]].currentPrice ? formatPrice(deal[maxPriceAccesors[0]].currentPrice, deal.domains[0], 'deal') : 'N/A';
    const previousPriceDay = (deal[maxPriceAccesors[0]].currentPrice && deal[maxPriceAccesors[0]].dropDay) ? formatPrice(deal[maxPriceAccesors[0]].currentPrice + deal[maxPriceAccesors[0]].dropDay, deal.domains[0], 'deal') : 'N/A';
    const percentageDropDay = deal[maxPriceAccesors[0]].percentageDropDay ? `${deal[maxPriceAccesors[0]].percentageDropDay} %` : 'N/A';



    // TEST_CODE
    // const test = checkDealEffectiveness(deal.availableDropDays, deal.availabeDropWeeks, deal.availableDropMonths);

    // const test_string = `\`\`\`json\n${test ? `Average[D,W,M]: [${Number.isInteger(test.averageDropDays) ? test.averageDropDays : test.averageDropDays.toFixed(2)}, ${Number.isInteger(test.averageDropWeeks) ? test.averageDropWeeks : test.averageDropWeeks.toFixed(2)}, ${Number.isInteger(test.averageDropMonths) ? test.averageDropMonths : test.averageDropMonths.toFixed(2)}]` : `Test`}`
    // + `\nDays: ${JSON.stringify(deal.availableDropDays)}\nWeeks: ${JSON.stringify(deal.availabeDropWeeks)}\nMonths: ${JSON.stringify(deal.availableDropMonths)}\`\`\``;

    // const {asin, title, image, categories, rootCat, brand, dealOf, productUrls, ...rest} = deal;

    // const dealString = JSON.stringify(rest, null, 4);




    const dealEmbed = new EmbedBuilder()
        .setColor('Random')
        .setThumbnail(deal.image)
        .setTimestamp()
        .setFooter({ text: 'Sniper Resell' })
        .setImage(`attachment://${productGraphAttachment?.name}`)
        .setTitle(`Nouveau Deal  :  ${flagEmojis.join(' ')}`)
        .setDescription(`**[${deal.title}](https://www.amazon.fr/dp/${deal.asin})**`)
        .addFields(
            { name: 'Prix actuel', value: `> **${currentPrice}**` },
            { name: 'Ancien prix', value: `> **${previousPriceDay}**` },
            { name: 'Réduction :arrow_down:', value: `> **${percentageDropDay}**` },
        );

    if (productDetails?.product?.monthlySold) {
        dealEmbed.addFields(
            { name: 'Ventes mensuelles', value: `> **${productDetails.product.monthlySold} +**` }
        );
    }

    dealEmbed.addFields(
        { name: 'Prix réduits', value: `> \`${maxPriceTypesDealOfString}\`` }
    );

    // console.log(deal.productUrls);

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
        embeds: [dealEmbed],
        components: [dealButtonRow]
    }

    if (roleId) {
        message.content = `<@&${roleId}>`
    }

    if (productGraphAttachment) {
        message.files = [productGraphAttachment];
    }

    // if (deal[maxPriceAccesors[0]].currentPrice > (deal[maxPriceAccesors[0]].currentPrice + deal[maxPriceAccesors[0]].dropDay)) {
    //     console.log(deal);
    // }

    // TEST_CODE
    return {
        message,
        // dealString
    };
}

module.exports = {
    getDealMessage
}