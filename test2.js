const { IMAGE_BASE_URL } = require('./utils/amazon.json');
const { priceTypesMap : priceTypesMapKeepa } = require('./utils/keepa.json');
const { getImage, formatKeepaDate, getDomainLocaleByDomainID } = require('./utils/helpers');

const dealOf = { '4': [0, 0, 18] };
const dealOfDomains = Object.keys(dealOf);

// get data like dealOf { '3': [0, 1, 18] } and convert it to like this { 'de' : ['Amazon', 'New', 'Buy Box'] }, should return the object not array
const formattedDealOf = dealOfDomains.reduce((acc, domainID) => {
    const domainLocale = getDomainLocaleByDomainID(domainID);
    const priceTypes = dealOf[domainID].map(priceType => priceTypesMapKeepa[priceType]);
    acc[domainLocale] = priceTypes;
    return acc;
}, {});

console.log(dealOf);
console.log(formattedDealOf);