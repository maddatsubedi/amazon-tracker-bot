const { IMAGE_BASE_URL } = require('./amazon.json');
const { priceTypesMap: priceTypesMapKeepa, priceTypesAccesor } = require('./keepa.json')
const { getDealImage, formatKeepaDate, getDomainLocaleByDomainID } = require('./helpers');

const processDealData = (deal) => {

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

    const data = { ...deal };
    data.image = getDealImage(deal.image);
    data.creationDate = formatKeepaDate(deal.creationDate);
    data.lastUpdate = formatKeepaDate(deal.lastUpdate);
    data.formattedDealOf = formattedDealOf;
    data.productUrls = productUrls;
    data.domains = dealOfDomains;
    data.availabePriceTypes = availabePriceTypes;
    data.maxPercentageDropDay = maxPercentageDropDay;

    return data;
}

module.exports = processDealData;