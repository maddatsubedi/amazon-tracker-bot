const { getBrandDomains , initializeDatabase} = require("./database/models/asins");
const { getKeepaTimeMinutes, getDomainIDs, formatPrice, getDomainLocaleByDomainID } = require("./utils/helpers");
const { keepaAPIKey } = require('./config.json');
const { priceTypesMap } = require('./utils/keepa.json');

// filepath: /d:/company/amazon-tracker-bot/test.js
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
                deltaPercentRange: [20, 100],
            };

            const url = `https://api.keepa.com/deal?key=${keepaAPIKey}&selection=${JSON.stringify(query)}`;

            try {
                const response = await fetch(url);

                if (!response.ok) {
                    console.log(await response.json());
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

                    const usedStat = {
                        currentPrice: deal.current[2] <= 0 ? null : formatPrice(deal.current[2], domainId),
                        avgDay: deal.avg[0][2] <= 0 ? null : formatPrice(deal.avg[0][2], domainId),
                        avgWeek: deal.avg[1][2] <= 0 ? null : formatPrice(deal.avg[1][2], domainId),
                        avgMonth: deal.avg[2][2] <= 0 ? null : formatPrice(deal.avg[2][2], domainId),
                        percentageDropDay: deal.deltaPercent[0][2] <= 0 ? null : deal.deltaPercent[0][2],
                        percentageDropWeek: deal.deltaPercent[1][2] <= 0 ? null : deal.deltaPercent[1][2],
                        percentageDropMonth: deal.deltaPercent[2][2] <= 0 ? null : deal.deltaPercent[2][2],
                        dropDay: deal.delta[0][2] <= 0 ? null : formatPrice(deal.delta[0][2], domainId),
                        dropWeek: deal.delta[1][2] <= 0 ? null : formatPrice(deal.delta[1][2], domainId),
                        dropMonth: deal.delta[2][2] <= 0 ? null : formatPrice(deal.delta[2][2], domainId),
                    };

                    const buyBoxStat = {
                        currentPrice: deal.current[18] <= 0 ? null : formatPrice(deal.current[18], domainId),
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
                    dealStat.usedStat = usedStat;
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
        const dealsError = [...new Set(errors)];

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
        count: {}, // Tracks deals count by priceType and domainId
        deals: [], // Consolidated list of unique deals
        errorCount: {}, // Tracks error count by priceType and domainId
        previousNumberOfDeals: 0, // Deals count before processing
        newNumberOfDeals: 0, // New unique deals count
        categories: {}, // Aggregated categories data
    };

    const processedASINs = new Set(); // Tracks unique ASINs to avoid duplicates

    // Aggregate previous number of deals
    result.previousNumberOfDeals = data.products.reduce((sum, product) => 
        sum + product.data.products.reduce((domainSum, domainData) => 
            domainSum + domainData.deals.length, 0
        ), 0);

    // Process each priceType
    for (const { priceType, priceTypeName, data: priceTypeData, categories } of data.products) {
        // Aggregate categories
        for (const [categoryId, category] of Object.entries(categories)) {
            if (!result.categories[categoryId]) {
                result.categories[categoryId] = { ...category };
            } else {
                result.categories[categoryId].count += category.count;
            }
        }

        // Initialize counters for this priceType
        result.count[priceType] = {};
        result.errorCount[priceType] = {};

        // Process each domain under the priceType
        for (const { domainId, deals, errorsCount } of priceTypeData.products) {
            // Initialize domain-specific counts
            result.count[priceType][domainId] = 0;
            result.errorCount[priceType][domainId] = errorsCount;

            for (const deal of deals) {
                if (!processedASINs.has(deal.asin)) {
                    // Mark ASIN as processed
                    processedASINs.add(deal.asin);

                    // Add additional deal metadata
                    deal.dealOf = {
                        priceType,
                        priceTypeName,
                        domainId,
                        locale: getDomainLocaleByDomainID(domainId),
                    };

                    // Add deal to results
                    result.deals.push(deal);

                    // Increment deal count for this priceType and domain
                    result.count[priceType][domainId]++;
                }
            }
        }
    }

    // Update new number of deals
    result.newNumberOfDeals = result.deals.length;

    // Add success or error flag
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
    // console.log(processedData);
    // console.log(processedData.result.deals[0]);
    // console.log(processedData.result.categories);
    // console.log(processedData.result.count);
    return processedData;
}

// fetchAndProcessProducts('adidas');

function setup(){
    initializeDatabase()
}

function main(){
    const startTime = Date.now();
    setup();
    fetchAndProcessProducts('adidas').then(() => {
        const endTime = Date.now();
        const timeTaken = endTime - startTime;
        console.log(`Time taken: ${timeTaken}ms`);
    });
}

main()
