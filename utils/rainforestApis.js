const axios = require('axios');
const {rainforestAPIKey} = require('../config.json');

const STORE_BASE_URL = `https://api.rainforestapi.com/request`;
const AMAZON_BASE_DOMAIN = 'amazon.';

const getProductsFromStore = async ({storeID, domain}) => {

    const params = {
        api_key: rainforestAPIKey,
        type: 'store',
        amazon_domain: `${AMAZON_BASE_DOMAIN}${'fr'}`,
        store_id: '9D8B67A3-7E9C-40FD-88C2-1668B6EB1C31'
    }

    try {
        
        const response = await axios.get(STORE_BASE_URL, {params});
        // console.log(response);
        if (response.status !== 200) {
            return {
                error: true,
                errorType: 'APIError',
                message: 'Error fetching store data'
            }
        }

        const data = await response.data;
        const products = data?.store_results;
        // console.log(data);
        // console.log(products);
        // console.log(products.length);
        return products;

    } catch (error) {
        // console.log(error);
        return {
            error: true,
            errorType: 'APIError',
            message: 'Error fetching store data'
        }
    }

};

module.exports = {
    getProductsFromStore
};