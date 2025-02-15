const { getBrandFromName } = require("../database/models/asins");
const { getRangeForDiscount } = require("../database/models/discount_range");
const { getDealMessage } = require("../embeds/dealsMessage");
// const { checkDealEffectiveness } = require("../test");
const { processDealData, analyzeDeal, FAKE_DEAL, GOOD_DEAL, PRICE_ERROR, ERROR } = require("../utils/apiHelpers");
const { priceTypesMap: priceTypesMapKeepa, priceTypesAccesor } = require('../utils/keepa.json');

const RATE_LIMIT_INTERVAL = 250; // 0.25 seconds, 4 requests per second
let lastRequestTime = 0;
let started = false;

const notify = async (client, deal) => {

    try {

        const processedDeal = processDealData(deal);

        const dealAnalysis = analyzeDeal(processedDeal);

        // if(dealAnalysis == FAKE_DEAL){
        //     return {
        //         error: true,
        //         errorType: 'DEAL_IS_FAKE'
        //     }
        // }

        if (!processedDeal) {
            return {
                error: true,
                errorType: 'ERROR_PROCESSING_DEAL'
            }
        }

        if (!processedDeal[processedDeal.maxPriceAccesors[0]]?.percentageDropDay) {
            console.log('NO_DISCOUNT_FOUND');
            return {
                error: true,
                errorType: 'NO_DISCOUNT_FOUND'
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

        const brandDetails = getBrandFromName(processedDeal.brand);

        if (!brandDetails) {
            return {
                error: true,
                errorType: 'NO_BRAND_CONFIGURED'
            }
        }

        const channelID = brandDetails.channel_id;

        const channel = await client.channels.fetch(channelID).catch((error) => {
            console.log("Error fetching DB saved channel from discord: ", error.message);
        });

        if (!channel) {
            return {
                error: true,
                errorType: 'NO_CHANNEL_CONFIGURED'
            }
        }

        const dealMessage = await getDealMessage(processedDeal, roleID, dealAnalysis);

        if (!dealMessage) {
            return {
                error: true,
                errorType: 'ERROR_CREATING_DEAL_MESSAGE'
            }
        }

        if (!dealMessage.message) {
            return {
                error: true,
                errorType: 'NO_MESSAGE_CREATED'
            }
        }

        if (Date.now() - lastRequestTime < RATE_LIMIT_INTERVAL && started) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_INTERVAL));
        }
        // TEST_CODE
        const sentMessage = await channel.send(dealMessage.message);
        // await sentMessage.reply(`\`\`\`For testing purposes:\n\`\`\`\`\`\`json\n${dealMessage.dealString}\`\`\``);
        // console.log(`Deal Notified: ${processedDeal.title}`);
        lastRequestTime = Date.now();
        started = true;
    } catch (error) {
        console.log(error);
    }

}

module.exports = notify;