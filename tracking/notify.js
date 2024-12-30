const { getRangeForDiscount } = require("../database/models/discount_range");
const { getDealEmbed } = require("../embeds/dealsEmbeds");
const processDealData = require("../utils/apiHelpers");
const { priceTypesMap: priceTypesMapKeepa, priceTypesAccesor } = require('../utils/keepa.json')

const notify = async (deal) => {

    const processedDeal = processDealData(deal);

    const maxPriceAccesors = processedDeal.maxPercentageDropDay.priceTypes.map(priceType => priceTypesAccesor[priceType]);

    const range = await getRangeForDiscount(processedDeal[maxPriceAccesors[0]].percentageDropDay);

    if (!range) {
        return {
            error: true,
            errorType: 'NO_RANGE_CONFIGURED'
        }
    }

    const roleID = range.roleID;
    const channelID = range.channelID;

    const dealEmbed = getDealEmbed(processedDeal, roleID);

    console.log(`Notified: ${processedDeal.title}`);

}

module.exports = notify;