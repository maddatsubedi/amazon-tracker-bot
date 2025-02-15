const { IMAGE_BASE_URL } = require('./amazon.json');
const { priceTypesMap: priceTypesMapKeepa, priceTypesAccesor } = require('./keepa.json')
const { getDealImage, formatKeepaDate, getDomainLocaleByDomainID } = require('./helpers');
const { keepaAPIKey } = require('../config.json');
const { getBrandFromName, removeExpiredAsins, insertAsins, getAsinsForBrand, insertSingleAsin, getAllAsins } = require('../database/models/asins');

const GOOD_DEAL = 'Good';
const PRICE_ERROR = 'Price Error';
const FAKE_DEAL = 'Fake';
const ERROR = 'System Error';

function calculatePriceChange(currentPrice, avgDay, avgWeek, avgMonth) {

    function percentageChange(newPrice, oldPrice) {
        if (oldPrice === 0) {
            return null; // Avoid division by zero
        }
        return ((newPrice - oldPrice) / oldPrice) * 100;
    }

    function assessDeal(currentPrice, probablePrice) {
        if (currentPrice < probablePrice * 0.95) {
            return GOOD_DEAL;
        } else if (currentPrice < probablePrice * 0.2) {
            return PRICE_ERROR;
        }
        else {
            return FAKE_DEAL;
        }
    }

    const probablePrice = (avgDay * 1 + avgWeek * 7 + avgMonth * 30) / (1 + 7 + 30);

    const dealAssessment = assessDeal(currentPrice, probablePrice);

    return {
        day: percentageChange(currentPrice, avgDay),
        week: percentageChange(currentPrice, avgWeek),
        month: percentageChange(currentPrice, avgMonth),
        probablePrice: probablePrice,
        dealAssessment: dealAssessment,
    };
}

const analyzeDeal = (processedDeal) => {
    if (!processedDeal?.asin) {
        return ERROR;
    }

    if (processedDeal.availabePriceTypes.length === 0) {
        return ERROR;
    }

    for (const priceType of processedDeal.availabePriceTypes) {
        let accesorDeal = processedDeal[priceTypesAccesor[priceType]]
        if (accesorDeal) {
            let priceChange = calculatePriceChange(accesorDeal.currentPrice, accesorDeal.avgDay, accesorDeal.avgWeek, accesorDeal.avgMonth);
            if (priceChange.dealAssessment === FAKE_DEAL || priceChange.dealAssessment === PRICE_ERROR) {
                return priceChange.dealAssessment;
            }
        }
    }

    return GOOD_DEAL;
}

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
    const availablePriceAccesors = availabePriceTypes.map(priceType => priceTypesAccesor[priceType]);
    const availableDropDays = availablePriceAccesors.map(priceAccesor => deal[priceAccesor].percentageDropDay);
    const availabeDropWeeks = availablePriceAccesors.map(priceAccesor => deal[priceAccesor].percentageDropWeek);
    const availableDropMonths = availablePriceAccesors.map(priceAccesor => deal[priceAccesor].percentageDropMonth);

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
    data.availablePriceAccesors = availablePriceAccesors;
    data.availableDropDays = availableDropDays;
    data.availabeDropWeeks = availabeDropWeeks;
    data.availableDropMonths = availableDropMonths;

    // console.log(deal);
    // console.log(data);
    // console.log('-----------------');

    return data;
}

const getTokensData = async () => {
    try {
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
    } catch (error) {
        return {
            error: 'API_ERROR',
        }
    }
}

// getTokensData().then(console.log);

const checkDBforNewDeals = (deals, type) => {
    const removeAsins = removeExpiredAsins(type);

    const dbAsins = getAllAsins(type);
    const dbAsinsArray = dbAsins.map(asin => asin.asin);

    const newDeals = deals.filter(deal => !dbAsinsArray.includes(deal.asin));

    return newDeals;
}

const insertAsin = (brand, deal, type) => {
    const brandData = getBrandFromName(brand);
    const dealsExpiresAt = new Date(new Date().setDate(new Date().getDate() + 2)).toUTCString();
    const addedAt = new Date().toUTCString();
    const dealCreatedAt = formatKeepaDate(deal.creationDate);

    const addAsins = insertSingleAsin(deal.asin, brandData.id, addedAt, dealsExpiresAt, dealCreatedAt, type);

    return addAsins;
}

const processDBForDeals = (brand, deals, type) => {
    const brandData = getBrandFromName(brand);
    const dealsExpiresAt = new Date(new Date().setDate(new Date().getDate() + 2)).toUTCString();

    const removeAsins = removeExpiredAsins(type);
    const expiredAsins = removeAsins.map(asin => asin.asin);

    const addAsins = insertAsins(brandData.id, deals, dealsExpiresAt, 'deal');

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
    checkDBforNewDeals,
    insertAsin,
    processDBForDeals,
    analyzeDeal,
    GOOD_DEAL,
    PRICE_ERROR,
    FAKE_DEAL,
    ERROR,
};