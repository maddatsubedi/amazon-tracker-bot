const { domain } = require('../utils/keepa.json');

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

function getAvailabeLocales() {
    return getDomainLocales(domain);
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

// Create a function that checks if the locales are valid

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
    validateAvailableLocales
};