const { IMAGE_BASE_URL } = require('./utils/amazon.json');
const { priceTypesMap: priceTypesMapKeepa } = require('./utils/keepa.json');
const { getDealImage, formatKeepaDate, getDomainLocaleByDomainID } = require('./utils/helpers');

const data = {
    asin: 'B084RKCJ2F',
    title: 'Ralph Lauren Damen 0ra4004 Sonnenbrille, Dorado, M',
    image: [
        54, 49, 120, 75, 83, 109,
        117, 76, 49, 80, 76, 46,
        106, 112, 103
    ],
    creationDate: 7358266,
    categories: [1981676031],
    rootCat: 11961464031,
    lastUpdate: 7358266,
    amazonStat: {
        currentPrice: '€125.76',
        avgDay: '€181.47',
        avgWeek: '€176.59',
        avgMonth: '€146.85',
        percentageDropDay: 200,
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
        percentageDropDay: 200,
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
        percentageDropDay: 300,
        percentageDropWeek: 29,
        percentageDropMonth: 14,
        dropDay: '€55.71',
        dropWeek: '€50.83',
        dropMonth: '€21.09'
    },
    dealOf: {
        '3': [0, 1, 18],
        '4': [0, 1]
    }
};

const processDealData = (deal) => {

    const priceTypesMap = {
        '0': 'amazonStat',
        '1': 'newStat',
        '18': 'buyBoxStat'
    }

    const dealOf = deal.dealOf;
    const dealOfDomains = Object.keys(dealOf);

    const formattedDealOf = dealOfDomains.reduce((acc, domainID) => {
        const domainLocale = getDomainLocaleByDomainID(domainID);
        const priceTypes = dealOf[domainID].map(priceType => priceTypesMapKeepa[priceType]);
        acc[domainLocale] = priceTypes;
        return acc;
    }, {});

    const productUrls = dealOfDomains.reduce((acc, domainID) => {
        const domainLocale = getDomainLocaleByDomainID(domainID);
        const domainUrl = `https://www.amazon.${domainLocale}/dp/${deal.asin}`;
        acc[domainID] = domainUrl;
        return acc;
    }, {});

    const availabePriceTypesArray = dealOfDomains.reduce((acc, domainID) => {
        return [...acc, ...dealOf[domainID]];
    }, []);

    const availabePriceTypes = [...new Set(availabePriceTypesArray)];

    const maxPercentageDropDay = availabePriceTypes.reduce((acc, priceType) => {
        const percentageDropDay = deal[priceTypesMap[priceType]].percentageDropDay;
        if (percentageDropDay > acc.value) {
            acc.value = percentageDropDay;
            acc.priceType = priceType;
        }
        return acc;
    }, { value: 0, priceType: null });

    const data = { ...deal };
    data.image = getDealImage(deal.image);
    data.creationDate = formatKeepaDate(deal.creationDate);
    data.lastUpdate = formatKeepaDate(deal.lastUpdate);
    data.formattedDealOf = formattedDealOf;
    data.productUrls = productUrls;
    data.domains = dealOfDomains;
    data.availabePriceTypes = availabePriceTypes;
    data.priceTypesMap = priceTypesMap;
    data.maxPercentageDropDay = maxPercentageDropDay;

    return data;
}

const startTime = Date.now();
console.log(processDealData(data));
// processDealData(data);
const endTime = Date.now();
console.log(`Execution Time: ${(endTime - startTime)}ms`);