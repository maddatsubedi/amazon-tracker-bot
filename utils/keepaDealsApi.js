const { getBrandDomains, initializeDatabase, getAllBrands, getAllTrackedBrands } = require("../database/models/asins");
const { getKeepaTimeMinutes, getDomainIDs, formatPrice, formatKeepaDate, getDomainLocaleByDomainID, getRefillTime, calculateTokensRefillTime, parseTimeToMilliseconds, formatTime } = require("./helpers");
const { keepaAPIKey } = require('../config.json');
const { priceTypesMap } = require('./keepa.json');
const cron = require('node-schedule');
const { setConfig, getConfig, setupGlobalTracking, isGlobalTrackingEnabled } = require("../database/models/config");
const notify = require("../tracking/notify");
const { checkDBforNewDeals, getTokensData, insertAsin } = require("./apiHelpers");
const { waitForTokensTarget } = require("./waitForTokens");
const { getProductDetailsGeneral } = require("./keepaProductApi");

const fetchProducts = async (brand, priceType) => {
    const domains = getBrandDomains(brand);
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
                        currentPrice: deal.current[0] <= 0 ? null : deal.current[0],
                        avgDay: deal.avg[0][0] <= 0 ? null : deal.avg[0][0],
                        avgWeek: deal.avg[1][0] <= 0 ? null : deal.avg[1][0],
                        avgMonth: deal.avg[2][0] <= 0 ? null : deal.avg[2][0],
                        percentageDropDay: deal.deltaPercent[0][0] <= 0 ? null : deal.deltaPercent[0][0],
                        percentageDropWeek: deal.deltaPercent[1][0] <= 0 ? null : deal.deltaPercent[1][0],
                        percentageDropMonth: deal.deltaPercent[2][0] <= 0 ? null : deal.deltaPercent[2][0],
                        dropDay: deal.delta[0][0] <= 0 ? null : deal.delta[0][0],
                        dropWeek: deal.delta[1][0] <= 0 ? null : deal.delta[1][0],
                        dropMonth: deal.delta[2][0] <= 0 ? null : deal.delta[2][0],
                    };

                    const newStat = {
                        currentPrice: deal.current[1] <= 0 ? null : deal.current[1],
                        avgDay: deal.avg[0][1] <= 0 ? null : deal.avg[0][1],
                        avgWeek: deal.avg[1][1] <= 0 ? null : deal.avg[1][1],
                        avgMonth: deal.avg[2][1] <= 0 ? null : deal.avg[2][1],
                        percentageDropDay: deal.deltaPercent[0][1] <= 0 ? null : deal.deltaPercent[0][1],
                        percentageDropWeek: deal.deltaPercent[1][1] <= 0 ? null : deal.deltaPercent[1][1],
                        percentageDropMonth: deal.deltaPercent[2][1] <= 0 ? null : deal.deltaPercent[2][1],
                        dropDay: deal.delta[0][1] <= 0 ? null : deal.delta[0][1],
                        dropWeek: deal.delta[1][1] <= 0 ? null : deal.delta[1][1],
                        dropMonth: deal.delta[2][1] <= 0 ? null : deal.delta[2][1],
                    };

                    // 🔴 DO NOT REMOVE
                    // const usedStat = {
                    //     currentPrice: deal.current[2] <= 0 ? null : deal.current[2],
                    //     avgDay: deal.avg[0][2] <= 0 ? null : deal.avg[0][2],
                    //     avgWeek: deal.avg[1][2] <= 0 ? null : deal.avg[1][2],
                    //     avgMonth: deal.avg[2][2] <= 0 ? null : deal.avg[2][2],
                    //     percentageDropDay: deal.deltaPercent[0][2] <= 0 ? null : deal.deltaPercent[0][2],
                    //     percentageDropWeek: deal.deltaPercent[1][2] <= 0 ? null : deal.deltaPercent[1][2],
                    //     percentageDropMonth: deal.deltaPercent[2][2] <= 0 ? null : deal.deltaPercent[2][2],
                    //     dropDay: deal.delta[0][2] <= 0 ? null : deal.delta[0][2],
                    //     dropWeek: deal.delta[1][2] <= 0 ? null : deal.delta[1][2],
                    //     dropMonth: deal.delta[2][2] <= 0 ? null : deal.delta[2][2],
                    // };

                    const buyBoxStat = {
                        currentPrice: deal.current[18] <= 0 ? null : deal.current[18],
                        avgDay: deal.avg[0][18] <= 0 ? null : deal.avg[0][18],
                        avgWeek: deal.avg[1][18] <= 0 ? null : deal.avg[1][18],
                        avgMonth: deal.avg[2][18] <= 0 ? null : deal.avg[2][18],
                        percentageDropDay: deal.deltaPercent[0][18] <= 0 ? null : deal.deltaPercent[0][18],
                        percentageDropWeek: deal.deltaPercent[1][18] <= 0 ? null : deal.deltaPercent[1][18],
                        percentageDropMonth: deal.deltaPercent[2][18] <= 0 ? null : deal.deltaPercent[2][18],
                        dropDay: deal.delta[0][18] <= 0 ? null : deal.delta[0][18],
                        dropWeek: deal.delta[1][18] <= 0 ? null : deal.delta[1][18],
                        dropMonth: deal.delta[2][18] <= 0 ? null : deal.delta[2][18],
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
                errors.push('EXCEPTION_ERROR');
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
    // console.log(data.products[0].data);
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

    // console.log(result.deals.slice(0, 5));

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

const brandTokensRequirements = {
    'adidas': 80,
    'nike': 70
};

const defaultTokensRequirements = 80;

// const tokensRefillInterval = 5000; // 5 seconds
const tokensWaitFallbackInterval = 2500; // 2.5 seconds
const notiTokensWaitInitial = 180000; // 3 minutes
const notiTokensWaitFurther = 90000; // 1.5 minutes
const brandPollingInterval = 2500; // 2.5 seconds
const cycleInterval = 60000; // 1 minute
let pollingStarted = false;

function setupPolling() {
    initializeDatabase();
    setupGlobalTracking()
}

const hasEnoughTokens = (brand) => {
    const requiredTokens = brandTokensRequirements[brand] || defaultTokensRequirements;
    return tokensLeft >= requiredTokens;
};

async function pollingMain(client) {
    const MAX_TOKENS = 1200;

    let tokenData = await getTokensData();

    let tokensLeft = tokenData.tokensLeft;
    let refillRate = tokenData.refillRate;
    let refillIn = tokenData.refillIn;
    let lastRefillTime = Date.now();
    let cronJob = null;

    const refillTokens = async () => {
        let tokenData = await getTokensData();
        tokensLeft = tokenData.tokensLeft;
        refillRate = tokenData.refillRate;
        refillIn = tokenData.refillIn;
        lastRefillTime = Date.now();

        if (refillRate === 0) {
            return {
                abort: 'NO_REFILL_RATE : SUBSCRIPTION_EXPIRED',
                abortMessage: 'Keepa subscription expired. Please renew the subscription.'
            }
        }
    };

    // setInterval(refillTokens, tokensRefillInterval);

    const waitForTokens = async (brand) => {
        if (!isGlobalTrackingEnabled()) {
            console.log('Global tracking is disabled.');
            return {
                abort: 'GLOBAL_TRACKING_DISABLED',
                abortMessage: 'Global tracking is disabled. Please enable global tracking.'
            }
        }
        const requiredTokens = brandTokensRequirements[brand] || defaultTokensRequirements;

        const tokensRefill = await refillTokens();

        if (tokensRefill?.abort) {
            console.log('Tokens refill rate is 0. Subscription expired.');
            return {
                abort: tokensRefill.abort,
                abortMessage: tokensRefill.abortMessage
            }
        }

        if (tokensLeft >= requiredTokens) {
            return;
        }

        const refillTime = calculateTokensRefillTime(refillRate, refillIn, tokensLeft, requiredTokens);
        const refillTimeInMs = parseTimeToMilliseconds(refillTime);

        console.log(`Not Enough Tokens, Brand: ${brand}, Refill Rime: ${refillTime} [${refillTimeInMs}ms], Fallback: ${tokensWaitFallbackInterval}ms`);
        await new Promise(resolve => setTimeout(resolve, (refillTimeInMs + tokensWaitFallbackInterval)));

        // Recursively check if tokens are now available
        return waitForTokens(brand);
    };

    const processBrandsSequentially = async () => {
        while (true) {
            if (!isGlobalTrackingEnabled()) {
                console.log('Global tracking is disabled.');
                return {
                    abort: 'GLOBAL_TRACKING_DISABLED',
                    abortMessage: 'Global tracking is disabled. Please enable global tracking.'
                }
            }
            let allBrandsData = getAllTrackedBrands();
            let brandsNameData = allBrandsData.map(brand => brand.name);

            if (brandsNameData.length === 0) {
                console.log('No brands to process.');
                return {
                    abort: 'NO_BRANDS',
                    abortMessage: 'No brands to process. Please add brands to track.'
                }
            }

            console.log(brandsNameData);

            for (let i = 0; i < brandsNameData.length; i++) {
                const brand = brandsNameData[i];
                console.log(`Processing ${brand}...`);

                const tokensWait = await waitForTokens(brand);

                if (tokensWait?.abort) {
                    console.log('Aborting all brands processing.');
                    return {
                        abort: tokensWait.abort,
                        abortMessage: tokensWait.abortMessage
                    }
                }

                console.log(`Fetching: ${brand}...`);

                const data = await fetchAndProcessProducts(brand);
                console.log(`Processing: ${brand} with ${data.result.deals.length} deals...`);

                const checkDB = checkDBforNewDeals(data.result.deals, 'deal');

                if (!checkDB) {
                    console.log(`Error processing ${brand}`);
                    continue;
                }

                if (checkDB.length === 0) {
                    console.log(`No new deals for ${brand}`);
                    continue;
                }

                const newDealsCount = checkDB.length;
                const requiredTokensForNoti = ((newDealsCount * 2) + 5);

                const tokenData = await getTokensData();
                const tokensLeft = tokenData.tokensLeft;
                const refillRate = tokenData.refillRate;
                const refillIn = tokenData.refillIn;

                const refillTime = calculateTokensRefillTime(refillRate, refillIn, tokensLeft, requiredTokensForNoti);
                const refillTimeInMs = parseTimeToMilliseconds(refillTime);

                if (tokensLeft < requiredTokensForNoti) {
                    const waitInterval = pollingStarted ? notiTokensWaitFurther : notiTokensWaitInitial;
                    if (refillTimeInMs < waitInterval) {
                        console.log(`Not enough tokens for notifications, Brand: ${brand}, Refill Time: ${refillTime} [${refillTimeInMs}ms], Fallback: ${tokensWaitFallbackInterval}ms`);
                        await new Promise(resolve => setTimeout(resolve, (refillTimeInMs + tokensWaitFallbackInterval)));
                    } else {
                        const refillTime = formatTime(waitInterval);
                        console.log(`Not enough tokens for notifications, Brand: ${brand}, Refill Time: ${refillTime} [${waitInterval}ms], DEFAULT_WAIT`);
                        await new Promise(resolve => setTimeout(resolve, waitInterval));
                    }
                }

                console.log(`Notifying and processing ${newDealsCount} new deals for ${brand}...`);

                for (let i = 0; i < newDealsCount; i++) {
                    await notify(client, checkDB[i]);

                    const addAsin = insertAsin(brand, checkDB[i], 'deal');
                }

                if (i < brandsNameData.length - 1) { // Don't wait after the last brand because we're going to wait for the next cycle
                    console.log(`Waiting for next brand processing: ${brandPollingInterval}ms`);
                    await new Promise(resolve => setTimeout(resolve, brandPollingInterval));
                }

                // if (i === brandsNameData.length - 1) {
                //     setImmediate(() => {
                //         console.log('Next round starting soon...');
                //     });
                // }
            }

            pollingStarted = true;

            console.log(`All brands processed, waiting for next cycle: ${cycleInterval}ms`);
            await new Promise(resolve => setTimeout(resolve, cycleInterval));

            console.log('Starting the next round of brand processing...');
        }
    };

    return await processBrandsSequentially();
}

module.exports = {
    setupPolling,
    pollingMain
}