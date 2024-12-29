const { getDealEmbed } = require("../embeds/dealsEmbeds");

const notify = async (deal) => {

    const range = await getRangeForDiscount(deal[maxPriceAccesors[0]].percentageDropDay);

    if (!range) {
        return {
            error: true,
            errorType: 'NO_RANGE_CONFIGURED'
        }
    }

    const roleID = range.roleID;
    const channelID = range.channelID;

    const dealEmbed = getDealEmbed(deal, roleID);

}

module.exports = notify;