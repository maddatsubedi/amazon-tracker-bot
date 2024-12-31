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

    // console.log(result.deals.slice(0, 5));

    return {
        result,
        tokensData: data.tokensData,
    };
};