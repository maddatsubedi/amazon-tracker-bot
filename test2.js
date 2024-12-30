const notify = require("./tracking/notify")

const data = {
    asin: 'B09TXWWZ7G',
    title: 'Polo Ralph Lauren Baskets Keaton Pony pour Homme, Blanc Multi PP, 47 EU',
    image: 'https://images-na.ssl-images-amazon.com/images/I/71vsYSoVpML.jpg',
    creationDate: 'Sat, 28 Dec 2024 07:08:00 GMT',
    categories: [1765043031],
    rootCat: 11961521031,
    lastUpdate: 'Sat, 28 Dec 2024 20:00:00 GMT',
    amazonStat: {
        currentPrice: 5512,
        avgDay: 7515,
        avgWeek: 7756,
        avgMonth: 7445,
        percentageDropDay: 42,
        percentageDropWeek: 29,
        percentageDropMonth: 26,
        dropDay: 2003,
        dropWeek: 2244,
        dropMonth: 1933
    },
    newStat: {
        currentPrice: 5512,
        avgDay: 7515,
        avgWeek: 7756,
        avgMonth: 7445,
        percentageDropDay: 27,
        percentageDropWeek: 29,
        percentageDropMonth: 26,
        dropDay: 2003,
        dropWeek: 2244,
        dropMonth: 1933
    },
    buyBoxStat: {
        currentPrice: 5512,
        avgDay: 7515,
        avgWeek: 7756,
        avgMonth: 7521,
        percentageDropDay: 27,
        percentageDropWeek: 29,
        percentageDropMonth: 27,
        dropDay: 2003,
        dropWeek: 2244,
        dropMonth: 2009
    },
    dealOf: { '4': [0, 1, 18] },
    brand: 'Ralph Lauren',
    formattedDealOf: { fr: ['Amazon', 'New', 'Buy Box'] },
    productUrls: { '4': 'https://www.amazon.fr/dp/B09TXWWZ7G' },
    domains: ['4'],
    availabePriceTypes: [0, 1, 18],
    maxPercentageDropDay: { value: 43, priceTypes: [0, 1, 18] }
}

notify(data);