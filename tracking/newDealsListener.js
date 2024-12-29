const priceChangeEmitter = require('./newDealsEmitter');

const setupPriceChangeListener = (client) => {
    priceChangeEmitter.on('priceChange', async (product) => {
        const { channelId, title, asin, oldPrice, newPrice } = product;

        try {
            const channel = client.channels.cache.get(channelId); // Fetch the channel by ID
            if (channel) {
                await channel.send({
                    content: `**Price Drop Alert!**\nProduct: [${title}](https://www.amazon.com/dp/${asin})\nOld Price: **$${oldPrice}**\nNew Price: **$${newPrice}**`
                });
            } else {
                console.warn(`Channel with ID ${channelId} not found.`);
            }
        } catch (error) {
            console.error(`Failed to send message for ASIN ${asin}:`, error);
        }
    });
};

module.exports = setupPriceChangeListener;
