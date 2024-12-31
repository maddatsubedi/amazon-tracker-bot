const { IMAGE_BASE_URL } = require('./amazon.json');
const { priceTypesMap: priceTypesMapKeepa, priceTypesAccesor } = require('./keepa.json')
const { getDealImage, formatKeepaDate, getDomainLocaleByDomainID } = require('./helpers');
const { keepaAPIKey } = require('../config.json');
const { getBrandFromName, removeExpiredAsins, insertAsins } = require('../database/models/asins');

const processDealData = (deal) => {

    // if (!deal.image) {
    //     console.log('NO_IMAGE', deal);
    // }

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
        const percentageDropDay = deal[priceTypesAccesor[priceType]].percentageDropDay;

        if (percentageDropDay > acc.value) {
            acc.value = percentageDropDay;
            acc.priceTypes = [priceType];
        } else if (percentageDropDay === acc.value) {
            acc.priceTypes.push(priceType);
        }

        return acc;
    }, { value: 0, priceTypes: [] });

    const maxPriceAccesors = maxPercentageDropDay.priceTypes.map(priceType => priceTypesAccesor[priceType]);

    const data = { ...deal };
    data.image = getDealImage(deal.image);
    data.creationDate = formatKeepaDate(deal.creationDate);
    data.lastUpdate = formatKeepaDate(deal.lastUpdate);
    data.formattedDealOf = formattedDealOf;
    data.productUrls = productUrls;
    data.domains = dealOfDomains;
    data.availabePriceTypes = availabePriceTypes;
    data.maxPercentageDropDay = maxPercentageDropDay;
    data.maxPriceAccesors = maxPriceAccesors;

    // console.log(deal);
    // console.log(data);
    // console.log('-----------------');

    return data;
}

const getTokensData = async () => {
    const url = `https://api.keepa.com/query?key=${keepaAPIKey}`;
    const response = await fetch(url);

    const data = await response?.json();

    if (!data || !data.timestamp) {
        return {
            error: 'API_ERROR',
        }
    }

    const tokensLeft = data.tokensLeft;
    const refillIn = data.refillIn;
    const refillRate = data.refillRate;

    return {
        tokensLeft,
        refillIn,
        refillRate,
    }
}

// getTokensData().then(console.log);

const processDBforDeals = (brand, deals) => {
    const brandData = getBrandFromName(brand);
    const dealsExpiresAt = new Date(new Date().setDate(new Date().getDate() + 2)).toUTCString();

    const removeAsins = removeExpiredAsins();
    const expiredAsins = removeAsins.map(asin => asin.asin); 
    const addAsins = insertAsins(brandData?.id, deals, dealsExpiresAt, 'deal');

    const newDeals = deals.filter(deal => addAsins.successfulAsins.includes(deal.asin));

    return {
        expiredAsinsCount: removeAsins.length,
        newAsinsCount: addAsins.successfulAsinsCount,
        duplicateAsinsCount: addAsins.duplicateAsinsCount,
        errorAsinsCount: addAsins.errorAsinsCount,
        totalAsinsCount: addAsins.totalAsinsCount,
        newAsins: addAsins.successfulAsins,
        expiredAsins: expiredAsins,
        newDeals: newDeals,
    }
}

module.exports = {
    processDealData,
    getTokensData,
    processDBforDeals,
 };