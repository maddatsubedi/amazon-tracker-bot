const { getBrandDomains } = require("./database/models/asins");
const { getKeepaTimeMinutes, getDomainIDs, formatPrice } = require("./utils/helpers");
const { keepaAPIKey } = require('../config.json');
const {priceTypesMap} = require('../utils/keepa.json');

const fetchProducts = async (brand, priceType) => {

    const domains = await getBrandDomains(brand);
    const domainIds = getDomainIDs(domains);

    const brandProducts = [];
    const categories = {};

    for (const domainId of domainIds) {

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
            }

            const url = `https://api.keepa.com/deal?key=${keepaAPIKey}&selection=${JSON.stringify(query)}`;

            try {

                const response = await fetch(url);

                if (!response.ok) {
                    console.log(await response.json());
                    errors.push('FETCH_ERROR');
                    break;
                }

                const data = await response.json();

                // console.log(data);
                // console.log(data.deals.dr[0]);
                // return;

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
                        }
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
                    }

                    const amazonStat = {
                        currentPrice: deal.current[0] <= 0 ? null : formatPrice(deal.current[0], domainId),
                        avgDay: deal.avg[0][0] <= 0 ? null : formatPrice(deal.avg[0][0], domainId),
                        avgWeek: deal.avg[1][0] <= 0 ? null : formatPrice(deal.avg[1][0], domainId),
                        avgMonth: deal.avg[2][0] <= 0 ? null : formatPrice(deal.avg[2][0], domainId),
                        percentageDropDay: deal.deltaPercent[0][0] <= 0 ? null : formatPrice(deal.avg[0][1], domainId),
                        percentageDropWeek: deal.deltaPercent[1][0] <= 0 ? null : formatPrice(deal.avg[1][1], domainId),
                        percentageDropMonth: deal.deltaPercent[2][0] <= 0 ? null : formatPrice(deal.avg[2][1], domainId),
                        dropDay: deal.delta[0][0] <= 0 ? null : formatPrice(deal.delta[0][0], domainId),
                        dropWeek: deal.delta[1][0] <= 0 ? null : formatPrice(deal.delta[1][0], domainId),
                        dropMonth: deal.delta[2][0] <= 0 ? null : formatPrice(deal.delta[2][0], domainId),
                    }

                    const newStat = {
                        currentPrice: deal.current[1] <= 0 ? null : formatPrice(deal.current[1], domainId),
                        avgDay: deal.avg[0][1] <= 0 ? null : formatPrice(deal.avg[0][1], domainId),
                        avgWeek: deal.avg[1][1] <= 0 ? null : formatPrice(deal.avg[1][1], domainId),
                        avgMonth: deal.avg[2][1] <= 0 ? null : formatPrice(deal.avg[2][1], domainId),
                        percentageDropDay: deal.deltaPercent[0][1] <= 0 ? null : formatPrice(deal.avg[0][1], domainId),
                        percentageDropWeek: deal.deltaPercent[1][1] <= 0 ? null : formatPrice(deal.avg[1][1], domainId),
                        percentageDropMonth: deal.deltaPercent[2][1] <= 0 ? null : formatPrice(deal.avg[2][1], domainId),
                        dropDay: deal.delta[0][1] <= 0 ? null : formatPrice(deal.delta[0][1], domainId),
                        dropWeek: deal.delta[1][1] <= 0 ? null : formatPrice(deal.delta[1][1], domainId),
                        dropMonth: deal.delta[2][1] <= 0 ? null : formatPrice(deal.delta[2][1], domainId),
                    }

                    const usedStat = {
                        currentPrice: deal.current[2] <= 0 ? null : formatPrice(deal.current[2], domainId),
                        avgDay: deal.avg[0][2] <= 0 ? null : formatPrice(deal.avg[0][2], domainId),
                        avgWeek: deal.avg[1][2] <= 0 ? null : formatPrice(deal.avg[1][2], domainId),
                        avgMonth: deal.avg[2][2] <= 0 ? null : formatPrice(deal.avg[2][2], domainId),
                        percentageDropDay: deal.deltaPercent[0][2] <= 0 ? null : formatPrice(deal.avg[0][2], domainId),
                        percentageDropWeek: deal.deltaPercent[1][2] <= 0 ? null : formatPrice(deal.avg[1][2], domainId),
                        percentageDropMonth: deal.deltaPercent[2][2] <= 0 ? null : formatPrice(deal.avg[2][2], domainId),
                        dropDay: deal.delta[0][2] <= 0 ? null : formatPrice(deal.delta[0][2], domainId),
                        dropWeek: deal.delta[1][2] <= 0 ? null : formatPrice(deal.delta[1][2], domainId),
                        dropMonth: deal.delta[2][2] <= 0 ? null : formatPrice(deal.delta[2][2], domainId),
                    }

                    const buyBoxStat = {
                        currentPrice: deal.current[18] <= 0 ? null : formatPrice(deal.current[18], domainId),
                        avgDay: deal.avg[0][18] <= 0 ? null : formatPrice(deal.avg[0][18], domainId),
                        avgWeek: deal.avg[1][18] <= 0 ? null : formatPrice(deal.avg[1][18], domainId),
                        avgMonth: deal.avg[2][18] <= 0 ? null : formatPrice(deal.avg[2][18], domainId),
                        percentageDropDay: deal.deltaPercent[0][18] <= 0 ? null : formatPrice(deal.avg[0][18], domainId),
                        percentageDropWeek: deal.deltaPercent[1][18] <= 0 ? null : formatPrice(deal.avg[1][18], domainId),
                        percentageDropMonth: deal.deltaPercent[2][18] <= 0 ? null : formatPrice(deal.avg[2][18], domainId),
                        dropDay: deal.delta[0][18] <= 0 ? null : formatPrice(deal.delta[0][18], domainId),
                        dropWeek: deal.delta[1][18] <= 0 ? null : formatPrice(deal.delta[1][18], domainId),
                        dropMonth: deal.delta[2][18] <= 0 ? null : formatPrice(deal.delta[2][18], domainId),
                    }

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

    }

    return {
        products: brandProducts,
        categories: categories,
    };
}

const fetchProductsOfAllPricesTypes = async (brand) => {
    const priceTypes = Object.keys(priceTypesMap).map(Number);

    const products = [];

    for (const priceType of priceTypes) {
        const data = await fetchProducts(brand, priceType);
        products.push({
            priceType: priceType,
            priceTypeName: priceTypesMap[priceType],
            data: data,
        });
    }

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
        count: {},
        deals: [],
        errorCount: {},
        previousNumberOfDeals: 0,
        newNumberOfDeals: 0,
    };

    const processedASINs = new Set();

    for (const product of data.products) {
        const { priceType, priceTypeName, data: priceTypeData } = product;

        result.count[priceType] = {};
        result.errorCount[priceType] = {};

        for (const domainData of priceTypeData.products) {
            const { domainId, deals, errorsCount } = domainData;

            result.count[priceType][domainId] = deals.length;
            result.previousNumberOfDeals += deals.length;

            result.errorCount[priceType][domainId] = errorsCount;

            for (const deal of deals) {
                if (!processedASINs.has(deal.asin)) {
                    result.deals.push(deal);
                    processedASINs.add(deal.asin);
                }
            }
        }
    }

    result.newNumberOfDeals = result.deals.length;
    if (result.newNumberOfDeals > 0) {
        result.success = true;
    } else {
        result.error = true;
    }

    return {
        result: result,
        tokensData: data.tokensData,
    };
};

const fetchAndProcessProducts = async (brand) => {
    const data = await fetchProductsOfAllPricesTypes(brand);
    const processedData = processFinalData(data);
    // console.log(processedData);
    return processedData;
}

module.exports = {
    fetchProducts,
    fetchProductsOfAllPricesTypes,
    processFinalData,
    fetchAndProcessProducts,
};