const axios = require('axios');
const { keepaAPIKey } = require('../config.json');
const { getLastPriceAndTimestamp, formatPrice, formatKeepaDate, getDomainIDByLocale, getAvailabeDomainIds, getDomainLocaleByDomainID, processDomainData, getKeepaTimeMinutes } = require('./helpers');
const { domain: keepaDomain } = require('./keepa.json');
const { insertAsins, brandExists, getBrandDomains } = require('../database/models/asins');
const { IMAGE_BASE_URL } = require('./amazon.json');

const getProductDetails = async ({ asin, domain = 1 }) => {

    if (!asin) {
        return {
            error: true,
            errorType: 'InvalidInput',
            message: 'ASIN is required'
        }
    }

    const url = `https://api.keepa.com/product?key=${keepaAPIKey}&domain=${domain}&asin=${asin}&stats=1&buybox=1&history=1&days=1`;

    try {
        const response = await fetch(url);
        // console.log(response);

        if (!response.ok) {
            return {
                error: true,
                errorType: 'APIError',
                message: 'Error fetching product data'
            }
        }

        const data = await response.json();
        // console.log(data);

        if (data.products && data.products.length > 0) {
            const product = data.products[0];

            if (!product.title) {
                return {
                    error: true,
                    errorType: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found'
                }
            }

            const domainId = product.domainId;
            const locale = keepaDomain[domainId]?.locale;
            const productDomain = `amazon.${locale}`;

            const productURL = `https://www.amazon.${locale}/dp/${asin}`;

            const productTitle = product.title;

            const lastUpdate = product.lastUpdate;
            const lastUpdateDate = formatKeepaDate(lastUpdate);

            const lastPriceUpdate = product.lastPriceChange;
            const lastPriceUpdateDate = formatKeepaDate(lastPriceUpdate);

            const amazonPrice = product.csv?.[0];
            const amazonPriceData = getLastPriceAndTimestamp(amazonPrice, domainId, 'product');

            const newPrice = product.csv?.[1];
            const newPriceData = getLastPriceAndTimestamp(newPrice, domainId, 'product');

            const usedPrice = product.csv?.[2];
            const usedPriceData = getLastPriceAndTimestamp(usedPrice, domainId, 'product');

            const buyBoxPrice = product.stats?.buyBoxPrice;
            const formattedBuyBoxPrice = formatPrice(buyBoxPrice, domainId, 'product');

            const images = product.imagesCSV?.split(',');
            const imageUrls = images?.map(image => `${IMAGE_BASE_URL}${image}`);

            return {
                success: true,
                product: {
                    asin,
                    domainId,
                    locale,
                    title: productTitle,
                    buyBoxPrice: formattedBuyBoxPrice,
                    amazonPriceData,
                    newPriceData,
                    usedPriceData,
                    images: imageUrls,
                    productURL,
                    productDomain,
                    lastUpdateDate,
                    lastPriceUpdateDate
                }
            }

        } else {
            return {
                error: true,
                errorType: 'PRODUCT_NOT_FOUND',
                message: 'Product not found'
            }
        }
    } catch (error) {
        console.log(error);
        return {
            error: true,
            errorType: 'ExceptionError',
            message: 'Error fetching product data'
        }
    }

};

const getProductGraphBuffer = async ({ asin, domain = 1, priceTypes }) => {

    if (!asin) {
        return {
            error: true,
            errorType: 'InvalidInput',
            message: 'ASIN is required'
        }
    }

    // console.log("Domain: ", domain);

    const priceTypesUrlParams = priceTypes ? Object.entries(priceTypes).map(([key, value]) => `&${key}=${value}`).join('') : '';

    const url = `https://api.keepa.com/graphimage?key=${keepaAPIKey}&domain=${domain}&asin=${asin}${priceTypesUrlParams}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        // console.log(imageBuffer);
        return imageBuffer;

    } catch (error) {
        // console.log(error);
        return;
    }

};

const getProductDetailsGeneral = async (asin, domain = 1) => {

    if (!asin) {
        return {
            error: true,
            errorType: 'InvalidInput',
            message: 'ASIN is required'
        }
    }

    const url = `https://api.keepa.com/product?key=${keepaAPIKey}&asin=${asin}&domain=${domain}`;

    try {
        const response = await fetch(url);
        // console.log(response);

        if (!response.ok) {
            return {
                error: true,
                errorType: 'APIError',
                message: 'Error fetching product data'
            }
        }

        const data = await response.json();
        // console.log(data);

        if (data.products && data.products.length > 0) {
            const product = data.products[0];

            if (!product.title) {
                return {
                    error: true,
                    errorType: 'PRODUCT_NOT_FOUND',
                    message: 'Product not found'
                }
            }

            return {
                success: true,
                product: product
            }

        } else {
            return {
                error: true,
                errorType: 'PRODUCT_NOT_FOUND',
                message: 'Product not found'
            }
        }
    } catch (error) {
        console.log(error);
        return {
            error: true,
            errorType: 'ExceptionError',
            message: 'Error fetching product data'
        }
    }

};

const addProducts = async ({ brand }) => {

    const PER_PAGE = 3000;

    if (!brand) {
        return {
            error: true,
            errorType: 'InvalidInput',
            message: 'Brand is required'
        }
    }

    const checkBrandExists = await brandExists(brand);

    if (!checkBrandExists) {
        return {
            error: true,
            errorType: 'BRAND_NOT_FOUND',
            message: 'Brand does not exist'
        }
    }

    const brandDomainsDB = await getBrandDomains(brand);
    const brandDomains = brandDomainsDB.includes('all') ? getAvailabeDomainIds() : brandDomainsDB.map(domain => getDomainIDByLocale(domain));

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

    const tokensRequired = (10 + (1 / 100) * PER_PAGE) * brandDomains.length;

    if (tokensLeft < tokensRequired) {
        return {
            error: true,
            errorType: 'LIMIT_REACHED',
            message: 'API limit reached',
            data: {
                tokensLeft,
                refillIn,
                refillRate,
                tokensRequired
            }
        }
    }

    const finalProducts = [];

    for (const domainID of brandDomains) {
        const query = {
            title: brand,
            perPage: PER_PAGE,
            singleVariation: true,
            lastPriceChange_gte: getKeepaTimeMinutes(30)
        }

        const url = `https://api.keepa.com/query?key=${keepaAPIKey}&domain=${domainID}&selection=${JSON.stringify(query)}`;

        try {

            // console.log(getDomainLocaleByDomainID(domainID));
            // continue;
            const response = await fetch(url);

            if (!response.ok) {
                finalProducts.push({
                    domainID: domainID,
                    data: {
                        error: true,
                        errorType: 'APIError',
                        message: 'Error fetching product data'
                    }
                });
                continue;
            }

            const data = await response.json();

            if (!data.asinList || data.asinList.length === 0) {
                finalProducts.push({
                    domainID: domainID,
                    data: {
                        error: true,
                        errorType: 'PRODUCTS_NOT_FOUND',
                        message: 'No products found'
                    }
                });
                break;
                // continue;
            }

            const products = data.asinList;
            const numberOfProducts = data.asinList.length;
            const totalResults = data.totalResults;
            // console.log(data);

            finalProducts.push({
                domainID: domainID,
                data: {
                    success: true,
                    totalResults,
                    numberOfProducts,
                    products
                }
            });

        } catch (error) {
            console.log(error);
            finalProducts.push({
                domain: {
                    id: domainID,
                    locale: getDomainIDByLocale(domainID)
                },
                data: {
                    error: true,
                    errorType: 'ExceptionError',
                    message: 'Error fetching product data'
                }
            });
        }
    }

    // console.log(finalProducts);

    const processedData = processDomainData(finalProducts);

    if (!processedData.successDomains) {
        return {
            error: true,
            errorType: 'PRODUCTS_NOT_FOUND',
            message: 'No products found'
        }
    }

    const successDomains = processedData.successDomains;
    const successLocales = successDomains.map(domain => getDomainLocaleByDomainID(domain));
    const errorDomains = processedData.errorDomains;
    let errorLocales;

    if (errorDomains) {
        errorLocales = errorDomains.map(domain => getDomainLocaleByDomainID(domain));
    }

    const dataCount = processedData.numberOfProducts;
    const optimization = processedData.optimization;
    const previousDataCount = processedData.previousNumberOfProducts;
    const totalDataCount = processedData.totalNumberOfProducts;

    const result = insertAsins(brand, processedData.products);

    if (!result) {
        return {
            error: true,
            errorType: 'DB_ERROR',
            message: 'Error adding products to database'
        }
    }

    const brandLocales = brandDomains.map(domain => getDomainLocaleByDomainID(domain));

    const successAsinsCount = result.successfulAsinsCount;
    const duplicateAsinsCount = result.duplicateAsinsCount;
    const errorAsinsCount = result.errorAsinsCount;
    const dbSuccess = result.success;
    const totalAsinsCount = result.totalAsinsCount;

    const returnData = {
        success: true,
        data: {
            brand,
            brandDomains,
            brandDomainsDB,
            dataCount,
            previousDataCount,
            optimization,
            dbSuccess,
            successAsinsCount,
            duplicateAsinsCount,
            errorAsinsCount,
            brandLocales,
            successDomains,
            successLocales,
            totalAsinsCount,
            totalDataCount
        }
    }

    if (errorDomains) {
        returnData.data.errorDomains = errorDomains;
        returnData.data.errorLocales = errorLocales;
    }

    return returnData;

}

module.exports = {
    getProductDetails,
    getProductDetailsGeneral,
    getProductGraphBuffer,
    addProducts
};