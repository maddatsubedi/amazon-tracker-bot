const { domain } = require('../utils/keepa.json');
const { IMAGE_BASE_URL } = require('../utils/amazon.json');

function checkRole(member, roleId) {
    return member.roles.cache.has(roleId);
}

function checkRolesFromList(member, roleIds) {
    return roleIds.some(roleId => member.roles.cache.has(roleId));
}

const validateRange = (range) => {
    const rangeRegex = /^(?:[1-9][0-9]?|100)-(?:[1-9][0-9]?|100)$/;

    if (rangeRegex.test(range)) {
        // Extract the values of a and b
        const [i, f] = range.split('-').map(Number);

        // Ensure b is greater than a
        if (f > i) {
            return { valid: true, i, f };
        } else {
            return { valid: false };
        }
    } else {
        return { valid: false };
    }
};

const formatPrice = (price, domainID) => {
    const currency = domain[domainID]?.currency || '$';
    if (price < 0) {
        return 'Out of Stock';
    }

    return `${currency}${(price / 100).toFixed(2)}`;
};

const formatKeepaDate = (date) => {
    return new Date((date + 21564000) * 60000).toUTCString();
}

const getLastPriceAndTimestamp = (dataArray, domainID) => {
    if (!Array.isArray(dataArray)) {
        return null;
    }

    if (dataArray.length === 0) {
        return null;
    }

    if (dataArray.length % 2 !== 0) {
        return null;
    }

    const lastTimestamp = dataArray[dataArray.length - 2];
    const lastPrice = dataArray[dataArray.length - 1];

    const formattedTimestamp = formatKeepaDate(lastTimestamp);

    const formattedPrice = formatPrice(lastPrice, domainID);

    return {
        lastPrice: formattedPrice,
        lastTimestamp: formattedTimestamp,
    };

}

const isValidASIN = (asin) => {
    const asinRegex = /^[A-Z0-9]{10}$/;
    return asinRegex.test(asin);
};

const getDomainIDByLocale = (locale) => {
    for (const [domainID, details] of Object.entries(domain)) {
        if (details.locale === locale) {
            return parseInt(domainID, 10);
        }
    }
    return null;
};

const generateRandomHexColor = () => {
    return `${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
};

const countDuplicatesInArray = (array) => {
    if (!Array.isArray(array)) {
        throw new Error('Input must be an array');
    }

    const counts = {};
    const duplicates = {};

    array.forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
    });

    for (const [item, count] of Object.entries(counts)) {
        if (count > 1) {
            duplicates[item] = count;
        }
    }

    return duplicates;
};

function getDomainLocales(domain) {
    const locales = [];

    for (const key in domain) {
        if (domain[key]?.locale) {
            locales.push(domain[key].locale);
        }
    }

    if (locales.length === 0) {
        return null;
    }

    return locales;
}

function getDomainIDs(domain) {

    if (domain.includes('all') && domain.length === 1) {
        return getAvailabeDomainIds();
    }

    const domainIDs = Object.keys(domain);


    if (domainIDs.length === 0) {
        return null;
    }

    return domainIDs;
}

function getAvailabeLocales() {
    return getDomainLocales(domain);
}

function getAvailabeDomainIds() {
    return Object.keys(domain);
}

function getDomainLocaleByDomainID(domainID) {
    return domain[domainID]?.locale;
}

function validateLocales(localesArray, domain) {
    const validLocales = new Set(
        Object.values(domain).map((entry) => entry.locale)
    );

    const seenLocales = new Set();
    const invalidLocales = [];
    const duplicateLocalesArray = [];

    for (const locale of localesArray) {
        if (!validLocales.has(locale)) {
            if (!invalidLocales.includes(locale)) {
                // continue;
                invalidLocales.push(locale);
            }
        } else if (seenLocales.has(locale)) {
            duplicateLocalesArray.push(locale);
        } else {
            seenLocales.add(locale);
        }
    }

    const duplicateLocales = [...new Set(duplicateLocalesArray)];

    return {
        isValid: invalidLocales.length === 0 && duplicateLocales.length === 0,
        invalidLocales,
        duplicateLocales,
    };
}

function validateAvailableLocales(localesArray) {
    return validateLocales(localesArray, domain);
}

function getRefillTime (tokensLeft, refillIn, refillRate) {
    const refillTime = new Date();
    refillTime.setSeconds(refillTime.getSeconds() + refillIn + (tokensLeft / refillRate));
    return refillTime;
}

function calculateTokensRefillTime(refillRate, refillIn, tokensLeft, tokensRequired) {
    const targetTokens = tokensRequired;
    
    if (tokensLeft >= targetTokens) {
        return "0 sec";
    }

    const refillInterval = 60000;
    let timeLeft = 0;
    
    function formatTime(ms) {
        let seconds = Math.floor(ms / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        seconds = seconds % 60;
        minutes = minutes % 60;

        let timeString = '';
        if (hours > 0) timeString += `${hours} hr : `;
        if (minutes > 0 || hours > 0) timeString += `${minutes} min : `;
        timeString += `${seconds} sec`;

        return timeString.trim();
    }

    if (tokensLeft < targetTokens) {
        let firstRefillTime = refillIn;
        tokensLeft += refillRate;
        if (tokensLeft >= targetTokens) {
            return formatTime(firstRefillTime);
        }
        timeLeft += firstRefillTime;
    }

    while (tokensLeft < targetTokens) {
        tokensLeft += refillRate;
        timeLeft += refillInterval;
    }

    return formatTime(timeLeft);
}

function processDomainData(domains) {
    const result = {};
    const productsSet = new Set();
    let previousNumberOfProducts = 0;
    let totalNumberOfProducts = 0;

    const MAX_PRODUCTS_PER_DOMAIN = 2500; // Maximum products to take from each domain

    domains.forEach(domain => {
        const { domainID, data } = domain;

        if (data.success) {
            result.successDomains = result.successDomains || [];
            result.successDomains.push(domainID);

            const limitedProducts = data.products.slice(0, MAX_PRODUCTS_PER_DOMAIN);
            limitedProducts.forEach(asin => productsSet.add(asin));

            previousNumberOfProducts += limitedProducts.length;

            totalNumberOfProducts += data.products.length;
        } else if (data.error) {
            result.errorDomains = result.errorDomains || [];
            result.errorDomains.push(domainID);
        }
    });

    result.products = Array.from(productsSet);
    result.numberOfProducts = productsSet.size;
    result.previousNumberOfProducts = previousNumberOfProducts;
    result.optimization = previousNumberOfProducts - result.numberOfProducts;
    result.totalNumberOfProducts = totalNumberOfProducts;

    return result;
}

function getKeepaTimeMinutes(daysAgo) {
    const KEEPATIME_OFFSET = 21564000;
    const MS_IN_A_MINUTE = 60000
    const now = Date.now();
    const targetTime = now - daysAgo * 24 * 60 * 60 * 1000;
    const keepaTime = Math.floor(targetTime / MS_IN_A_MINUTE) - KEEPATIME_OFFSET;
    return keepaTime;
}

const getDealImage = (image) => {
    return `${IMAGE_BASE_URL}${String.fromCharCode(...image)}`;
}

module.exports = {
    checkRole,
    checkRolesFromList,
    validateRange,
    formatPrice,
    getLastPriceAndTimestamp,
    isValidASIN,
    getDomainIDByLocale,
    generateRandomHexColor,
    formatKeepaDate,
    countDuplicatesInArray,
    getDomainLocales,
    getAvailabeLocales,
    getDomainLocaleByDomainID,
    validateLocales,
    validateAvailableLocales,
    getAvailabeDomainIds,
    getRefillTime,
    calculateTokensRefillTime,
    processDomainData,
    getKeepaTimeMinutes,
    getDomainIDs,
    getDealImage
};