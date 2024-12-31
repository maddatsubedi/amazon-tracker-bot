const { getRangeForDiscount } = require("../database/models/discount_range");
const { getDealMessage } = require("../embeds/dealsMessage");
const { processDealData } = require("../utils/apiHelpers");
const { priceTypesMap: priceTypesMapKeepa, priceTypesAccesor } = require('../utils/keepa.json');

const notify = async (client, deal) => {

    try {

        const processedDeal = processDealData(deal);

        if (!processedDeal) {
            return {
                error: true,
                errorType: 'ERROR_PROCESSING_DEAL'
            }
        }

        const range = await getRangeForDiscount(processedDeal[processedDeal.maxPriceAccesors[0]].percentageDropDay);

        if (!range) {
            return {
                error: true,
                errorType: 'NO_RANGE_CONFIGURED'
            }
        }

        const roleID = range.roleID;
        const channelID = range.channelID;

        const channel = await client.channels.fetch(channelID);

        if (!channel) {
            return {
                error: true,
                errorType: 'NO_CHANNEL_CONFIGURED'
            }
        }

        const dealMessage = await getDealMessage(processedDeal, roleID);

        if (!dealMessage) {
            return {
                error: true,
                errorType: 'ERROR_CREATING_DEAL_MESSAGE'
            }
        }

        await channel.send(dealMessage);
        // console.log(`Deal Notified: ${processedDeal.title}`);
    } catch (error) {
        console.log(error);
    }

}

module.exports = notify;