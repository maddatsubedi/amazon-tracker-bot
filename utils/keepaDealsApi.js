const { getBrandDomains, initializeDatabase, getAllBrands, getAllTrackedBrands } = require("../database/models/asins");
const { getKeepaTimeMinutes, getDomainIDs, formatPrice, formatKeepaDate, getDomainLocaleByDomainID, getRefillTime, calculateTokensRefillTime, parseTimeToMilliseconds } = require("./helpers");
const { keepaAPIKey } = require('../config.json');
const { priceTypesMap } = require('./keepa.json');
const cron = require('node-schedule');
const { setConfig, getConfig, setupGlobalTracking, isGlobalTrackingEnabled } = require("../database/models/config");
const notify = require("../tracking/notify");
const { processDBforDeals, getTokensData } = require("./apiHelpers");

const fetchProducts = async (brand, priceType) => {
    const domains = await getBrandDomains(brand);
    const domainIds = getDomainIDs(domains);

    const brandProducts = [];
    const categories = {};

    await Promise.all(domainIds.map(async (domainId) => {
        const deals = [];
        const errors = [];
        let page = 0;

        while (true) {
            const query = {
                domainId: domainId,
                page: page,
                titleSearch: brand,
                priceTypes: priceType,
                dateRange: 0,
                isRangeEnabled: true,
                deltaPercentRange: [40, 100],
            };

            const url = `https://api.keepa.com/deal?key=${keepaAPIKey}&selection=${JSON.stringify(query)}`;

            try {
                const response = await fetch(url);

                if (!response.ok) {
                    console.log('FETCH_ERROR');
                    errors.push('FETCH_ERROR');
                    break;
                }

                const data = await response.json();

                if (!data) {
                    errors.push('NO_DATA');
                    break;
                }

                const dealsCount = data.deals.dr.length;

                if (dealsCount === 0) {
                    if (page === 0) {
                        errors.push('NO_DEALS');
                    }
                    break;
                }

                const categoriesNames = data.deals.categoryNames;
                const categoriesIds = data.deals.categoryIds;
                const categoriesCount = data.deals.categoryCount;

                for (let i = 0; i < categoriesNames.length; i++) {
                    const categoryId = categoriesIds[i];
                    const categoryName = categoriesNames[i];
                    const categoryCount = categoriesCount[i];

                    if (categories[categoryId]) {
                        categories[categoryId].count += categoryCount;
                    } else {
                        categories[categoryId] = {
                            name: categoryName,
                            count: categoryCount,
                        };
                    }
                }

                for (const deal of data.deals.dr) {
                    const dealStat = {
                        asin: deal.asin,
                        title: deal.title,
                        image: deal.image,
                        creationDate: deal.creationDate,
                        categories: deal.categories,
                        rootCat: deal.rootCat,
                        lastUpdate: deal.lastUpdate,
                    };

                    const amazonStat = {
                        currentPrice: deal.current[0] <= 0 ? null : formatPrice(deal.current[0], domainId),
                        previousPriceDay: (deal.current[0] <= 0 && deal.delta[0][0] <= 0) ? null : formatPrice((deal.current[0] + deal.delta[0][0]), domainId),
                        avgDay: deal.avg[0][0] <= 0 ? null : formatPrice(deal.avg[0][0], domainId),
                        avgWeek: deal.avg[1][0] <= 0 ? null : formatPrice(deal.avg[1][0], domainId),
                        avgMonth: deal.avg[2][0] <= 0 ? null : formatPrice(deal.avg[2][0], domainId),
                        percentageDropDay: deal.deltaPercent[0][0] <= 0 ? null : deal.deltaPercent[0][0],
                        percentageDropWeek: deal.deltaPercent[1][0] <= 0 ? null : deal.deltaPercent[1][0],
                        percentageDropMonth: deal.deltaPercent[2][0] <= 0 ? null : deal.deltaPercent[2][0],
                        dropDay: deal.delta[0][0] <= 0 ? null : formatPrice(deal.delta[0][0], domainId),
                        dropWeek: deal.delta[1][0] <= 0 ? null : formatPrice(deal.delta[1][0], domainId),
                        dropMonth: deal.delta[2][0] <= 0 ? null : formatPrice(deal.delta[2][0], domainId),
                    };

                    const newStat = {
                        currentPrice: deal.current[1] <= 0 ? null : formatPrice(deal.current[1], domainId),
                        previousPriceDay: (deal.current[1] <= 0 && deal.delta[0][1] <= 0) ? null : formatPrice((deal.current[1] + deal.delta[0][1]), domainId),
                        avgDay: deal.avg[0][1] <= 0 ? null : formatPrice(deal.avg[0][1], domainId),
                        avgWeek: deal.avg[1][1] <= 0 ? null : formatPrice(deal.avg[1][1], domainId),
                        avgMonth: deal.avg[2][1] <= 0 ? null : formatPrice(deal.avg[2][1], domainId),
                        percentageDropDay: deal.deltaPercent[0][1] <= 0 ? null : deal.deltaPercent[0][1],
                        percentageDropWeek: deal.deltaPercent[1][1] <= 0 ? null : deal.deltaPercent[1][1],
                        percentageDropMonth: deal.deltaPercent[2][1] <= 0 ? null : deal.deltaPercent[2][1],
                        dropDay: deal.delta[0][1] <= 0 ? null : formatPrice(deal.delta[0][1], domainId),
                        dropWeek: deal.delta[1][1] <= 0 ? null : formatPrice(deal.delta[1][1], domainId),
                        dropMonth: deal.delta[2][1] <= 0 ? null : formatPrice(deal.delta[2][1], domainId),
                    };

                    // 🔴 DO NOT REMOVE
                    // const usedStat = {
                    //     currentPrice: deal.current[2] <= 0 ? null : formatPrice(deal.current[2], domainId),
                    //     previousPriceDay: (deal.current[2] <= 0 && deal.delta[0][2] <= 0) ? null : formatPrice((deal.current[2] + deal.delta[0][2]), domainId),
                    //     avgDay: deal.avg[0][2] <= 0 ? null : formatPrice(deal.avg[0][2], domainId),
                    //     avgWeek: deal.avg[1][2] <= 0 ? null : formatPrice(deal.avg[1][2], domainId),
                    //     avgMonth: deal.avg[2][2] <= 0 ? null : formatPrice(deal.avg[2][2], domainId),
                    //     percentageDropDay: deal.deltaPercent[0][2] <= 0 ? null : deal.deltaPercent[0][2],
                    //     percentageDropWeek: deal.deltaPercent[1][2] <= 0 ? null : deal.deltaPercent[1][2],
                    //     percentageDropMonth: deal.deltaPercent[2][2] <= 0 ? null : deal.deltaPercent[2][2],
                    //     dropDay: deal.delta[0][2] <= 0 ? null : formatPrice(deal.delta[0][2], domainId),
                    //     dropWeek: deal.delta[1][2] <= 0 ? null : formatPrice(deal.delta[1][2], domainId),
                    //     dropMonth: deal.delta[2][2] <= 0 ? null : formatPrice(deal.delta[2][2], domainId),
                    // };

                    const buyBoxStat = {
                        currentPrice: deal.current[18] <= 0 ? null : formatPrice(deal.current[18], domainId),
                        previousPriceDay: (deal.current[18] <= 0 && deal.delta[0][18] <= 0) ? null : formatPrice((deal.current[18] - deal.delta[0][18]), domainId),
                        avgDay: deal.avg[0][18] <= 0 ? null : formatPrice(deal.avg[0][18], domainId),
                        avgWeek: deal.avg[1][18] <= 0 ? null : formatPrice(deal.avg[1][18], domainId),
                        avgMonth: deal.avg[2][18] <= 0 ? null : formatPrice(deal.avg[2][18], domainId),
                        percentageDropDay: deal.deltaPercent[0][18] <= 0 ? null : deal.deltaPercent[0][18],
                        percentageDropWeek: deal.deltaPercent[1][18] <= 0 ? null : deal.deltaPercent[1][18],
                        percentageDropMonth: deal.deltaPercent[2][18] <= 0 ? null : deal.deltaPercent[2][18],
                        dropDay: deal.delta[0][18] <= 0 ? null : formatPrice(deal.delta[0][18], domainId),
                        dropWeek: deal.delta[1][18] <= 0 ? null : formatPrice(deal.delta[1][18], domainId),
                        dropMonth: deal.delta[2][18] <= 0 ? null : formatPrice(deal.delta[2][18], domainId),
                    };

                    dealStat.amazonStat = amazonStat;
                    dealStat.newStat = newStat;
                    // dealStat.usedStat = usedStat;
                    dealStat.buyBoxStat = buyBoxStat;

                    deals.push(dealStat);
                }

                if (dealsCount < 150) {
                    break;
                }

                page++;
            } catch (error) {
                console.log(error);
                errors.push('FETCH_ERROR');
                break;
            }
        }

        const errorsCount = errors.length;
        const dealsError = errors.reduce((acc, error) => {
            if (acc[error]) {
                acc[error]++;
            } else {
                acc[error] = 1;
            }
            return acc;
        }, {});

        brandProducts.push({
            domainId: domainId,
            deals: deals,
            errors: dealsError,
            errorsCount: errorsCount,
        });
    }));

    return {
        products: brandProducts,
        categories: categories,
    };
};

const fetchProductsOfAllPricesTypes = async (brand) => {
    const priceTypes = Object.keys(priceTypesMap).map(Number);

    const products = await Promise.all(priceTypes.map(async (priceType) => {
        const data = await fetchProducts(brand, priceType);
        return {
            priceType: priceType,
            priceTypeName: priceTypesMap[priceType],
            data: data,
            categories: data.categories,
        };
    }));

    const url = `https://api.keepa.com/query?key=${keepaAPIKey}`;
    const response = await fetch(url);

    const data = await response?.json();

    if (!data || !data.timestamp) {
        return {
            error: true,
            errorType: 'APIError',
            message: 'Error fetching product data'
        }
    }

    const tokensLeft = data.tokensLeft;
    const refillIn = data.refillIn;
    const refillRate = data.refillRate;

    const productsData = {
        brand: brand,
        products: products,
        tokensData: {
            tokensLeft: tokensLeft,
            refillIn: refillIn,
            refillRate: refillRate,
        }
    }

    return productsData;
}

const processFinalData = (data) => {
    const result = {
        count: {},
        deals: [],
        errorCount: {},
        previousNumberOfDeals: 0,
        newNumberOfDeals: 0,
        categories: {},
        brand: data.brand,
    };

    const processedASINs = new Map();

    result.previousNumberOfDeals = data.products.reduce((sum, product) =>
        sum + product.data.products.reduce((domainSum, domainData) =>
            domainSum + domainData.deals.length, 0
        ), 0);

    for (const { priceType, priceTypeName, data: priceTypeData, categories } of data.products) {
        for (const [categoryId, category] of Object.entries(categories)) {
            if (!result.categories[categoryId]) {
                result.categories[categoryId] = { ...category };
            } else {
                result.categories[categoryId].count += category.count;
            }
        }

        result.count[priceType] = {};
        result.errorCount[priceType] = {};

        for (const { domainId, deals, errors } of priceTypeData.products) {
            result.count[priceType][domainId] = 0;

            if (!result.errorCount[priceType][domainId]) {
                result.errorCount[priceType][domainId] = {};
            }

            for (const [errorName, errorCount] of Object.entries(errors)) {
                if (!result.errorCount[priceType][domainId][errorName]) {
                    result.errorCount[priceType][domainId][errorName] = 0;
                }
                result.errorCount[priceType][domainId][errorName] += errorCount;
            }

            for (const deal of deals) {
                if (!processedASINs.has(deal.asin)) {
                    processedASINs.set(deal.asin, {});
                }

                if (!processedASINs.get(deal.asin)[domainId]) {
                    processedASINs.get(deal.asin)[domainId] = [];
                }

                if (!processedASINs.get(deal.asin)[domainId].includes(priceType)) {
                    processedASINs.get(deal.asin)[domainId].push(priceType);
                }

                if (!processedASINs.get(deal.asin).processed) {
                    processedASINs.get(deal.asin).processed = true;

                    const dealOf = { ...processedASINs.get(deal.asin) };
                    delete dealOf.processed;

                    deal.dealOf = dealOf;

                    deal.brand = data.brand;

                    result.deals.push(deal);

                    result.count[priceType][domainId]++;
                }
            }
        }
    }

    result.newNumberOfDeals = result.deals.length;

    result.success = result.newNumberOfDeals > 0;
    result.error = result.newNumberOfDeals === 0;

    return {
        result,
        tokensData: data.tokensData,
    };
};

const fetchAndProcessProducts = async (brand) => {
    const data = await fetchProductsOfAllPricesTypes(brand);
    const processedData = processFinalData(data);
    return processedData;
}

const brandTokenRequirements = {
    'adidas': 100,
    'nike': 120
};

function setup() {
    initializeDatabase();
    setupGlobalTracking()
}

const hasEnoughTokens = (brand) => {
    const requiredTokens = brandTokenRequirements[brand] || 100;
    return tokensLeft >= requiredTokens;
};

async function pollingMain(client, interval) {
    const MAX_TOKENS = 1200;

    let tokenData = await getTokensData();

    let tokensLeft = tokenData.tokensLeft;
    let refillRate = tokenData.refillIn;
    let refillIn = tokenData.refillRate;
    let lastRefillTime = Date.now();
    let cronJob = null;

    const refillTokens = async () => {
        let tokenData = await getTokensData()
        tokensLeft = tokenData.tokensLeft;
        refillRate = tokenData.refillIn;
        refillIn = tokenData.refillRate;
        lastRefillTime = Date.now();
    };

    setInterval(refillTokens, 60000);
    // setInterval(refillTokens, 60000);

    const waitForTokens = async (brand) => {
        if (!isGlobalTrackingEnabled()) {
            return;
        }
        const requiredTokens = brandTokenRequirements[brand] || 100;

        if (tokensLeft >= requiredTokens) {
            return;
        }

        const refillTime = calculateTokensRefillTime(refillRate, refillIn, tokensLeft, requiredTokens);
        const refillTimeInMs = parseTimeToMilliseconds(refillTime);

        console.log(`Not enough:${brand}. refil time ${refillTime}.`);
        await new Promise(resolve => setTimeout(resolve, refillTimeInMs));

        // Recursively check if tokens are now available
        return waitForTokens(brand);
    };

    const processBrandsSequentially = async () => {
        while (true) {
            if (!isGlobalTrackingEnabled()) {
                break;
            }
            let allBrandsData = getAllTrackedBrands();
            let brandsNameData = allBrandsData.map(brand => brand.name);
            console.log(brandsNameData);

            for (let i = 0; i < brandsNameData.length; i++) {
                const brand = brandsNameData[i];
                console.log(`Processing ${brand}...`);

                await waitForTokens(brand);

                console.log(`Fetching: ${brand}...`);

                const data = await fetchAndProcessProducts(brand);
                console.log(`Processing: ${brand} with ${data.result.deals.length} deals...`);

                // const processDB = processDBforDeals(brand, data.result.deals);

                // if (!processDB) {
                //     console.log(`Error processing ${brand}`);
                //     continue;
                // }

                // const newDeals = processDB.newDeals;

                // if (processDB.newDeals.length === 0) {
                //     console.log(`No new deals for ${brand}`);
                //     continue;
                // }

                // console.log(`Notifying ${newDeals.length} new deals for ${brand}...`);

                for (let i = 0; i < data.result.deals.length; i++) {
                    notify(client, data.result.deals[i]);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
                    // console.log(newDeals[i]);
                }

                if (i < brandsNameData.length - 1) { // Don't wait after the last brand
                    console.log(`Waiting for ${interval}ms`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                if (i === brandsNameData.length - 1) {
                    setImmediate(() => {
                        console.log('Next round starting soon...');
                    });
                }
            }

            console.log('All brands processed.');
            await new Promise(resolve => setTimeout(resolve, interval));

            setImmediate(() => {
                console.log('Starting the next round of brand processing...');
            });
        }
    };

    await processBrandsSequentially();
}

module.exports = {
    setup,
    pollingMain
}