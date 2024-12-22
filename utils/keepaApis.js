const axios = require('axios');
const { keepaAPIKey } = require('../config.json');
const { getLastPriceAndTimestamp, formatPrice, formatKeepaDate } = require('./helpers');
const { domain: keepaDomain } = require('./keepa.json');
const { insertAsins } = require('../database/models/asins');

const IMAGE_BASE_URL = 'https://images-na.ssl-images-amazon.com/images/I/';

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
            const amazonPriceData = getLastPriceAndTimestamp(amazonPrice, domainId);

            const newPrice = product.csv?.[1];
            const newPriceData = getLastPriceAndTimestamp(newPrice, domainId);

            const usedPrice = product.csv?.[2];
            const usedPriceData = getLastPriceAndTimestamp(usedPrice, domainId);

            const buyBoxPrice = product.stats?.buyBoxPrice;
            const formattedBuyBoxPrice = formatPrice(buyBoxPrice, domainId);

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

const getProductGraphBuffer = async ({ asin, domain = 1 }) => {

    if (!asin) {
        return {
            error: true,
            errorType: 'InvalidInput',
            message: 'ASIN is required'
        }
    }

    const url = `https://api.keepa.com/graphimage?key=${keepaAPIKey}&domain=${domain}&asin=${asin}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return {
                error: true,
                errorType: 'APIError',
                message: 'Error fetching product data'
            }
        }

        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        // console.log(imageBuffer);
        return imageBuffer;

    } catch (error) {
        // console.log(error);
        return {
            error: true,
            errorType: 'ExceptionError',
            message: 'Error fetching product data'
        }
    }

};

const getProducts = async({domain = 1}) => {
    // if (!domain) {
    //     return {
    //         error: true,
    //         errorType: 'InvalidInput',
    //         message: 'Domain is required'
    //     }
    // }

    const query = {
        title: 'Ralph Lauren',
        // brand: 'adidas',
        perPage: 10000,
    }

    const url = `https://api.keepa.com/query?key=${keepaAPIKey}&domain=${domain}&selection=${JSON.stringify(query)}`;

    try {

        const response = await fetch(url);
        
        if (!response.ok) {
            return {
                error: true,
                errorType: 'APIError',
                message: 'Error fetching product data'
            }
        }

        const data = await response.json();

        if (!data.asinList || data.asinList.length === 0) {
            return {
                error: true,
                errorType: 'PRODUCT_NOT_FOUND',
                message: 'No products found'
            }
        }

        const products = data.asinList;
        const numberOfProducts = data.asinList.length;

        console.log(data);
        console.log(numberOfProducts);
        console.log(products.slice(-50));

        // const result = insertAsins('ralph lauren', products);
        // console.log(result);

    } catch (error) {
        console.log(error);
        return {
            error: true,
            errorType: 'ExceptionError',
            message: 'Error fetching product data'
        }
    }
}

module.exports = {
    getProductDetails,
    getProductGraphBuffer,
    getProducts
};