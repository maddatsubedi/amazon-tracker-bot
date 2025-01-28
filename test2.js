// Example usage with your provided deals
const deals = [
    {
        asin: 'B09Z6YNWFY',
        title: 'Hugo Boss Damen Kirk_slid_rblg SLIDE, Open Blue463, Einheitsgröße EU',
        image: 'https://images-na.ssl-images-amazon.com/images/I/61cqmvGnLnL.jpg',
        creationDate: 'Mon, 27 Jan 2025 17:56:00 GMT',
        categories: [17302993031],
        rootCat: 11961464031,
        lastUpdate: 'Tue, 28 Jan 2025 06:16:00 GMT',
        amazonStat: {
            currentPrice: 1666,
            avgDay: 3344,
            avgWeek: 3784,
            avgMonth: 3368,
            percentageDropDay: 50,
            percentageDropWeek: 56,
            percentageDropMonth: 51,
            dropDay: 1678,
            dropWeek: 2118,
            dropMonth: 1702
        },
        newStat: {
            currentPrice: 1666,
            avgDay: 3344,
            avgWeek: 3784,
            avgMonth: 3368,
            percentageDropDay: 50,
            percentageDropWeek: 56,
            percentageDropMonth: 51,
            dropDay: 1678,
            dropWeek: 2118,
            dropMonth: 1702
        },
        buyBoxStat: {
            currentPrice: 1666,
            avgDay: 3344,
            avgWeek: 3784,
            avgMonth: 3368,
            percentageDropDay: 50,
            percentageDropWeek: 56,
            percentageDropMonth: 51,
            dropDay: 1678,
            dropWeek: 2118,
            dropMonth: 1702
        },
        dealOf: { '3': [0, 1, 18] },
        brand: 'hugo boss',
        formattedDealOf: { de: ['Amazon', 'New', 'Buy Box'] },
        productUrls: { '3': 'https://www.amazon.de/dp/B09Z6YNWFY' },
        domains: ['3'],
        availabePriceTypes: [0, 1, 18],
        maxPercentageDropDay: { value: 50, priceTypes: [0, 1, 18] },
        maxPriceAccesors: ['amazonStat', 'newStat', 'buyBoxStat'],
        availablePriceAccesors: ['amazonStat', 'newStat', 'buyBoxStat'],
        availableDropDays: [50, 50, 50],
        availabeDropWeeks: [56, 56, 56],
        availableDropMonths: [51, 51, 51]
    },
    {
        asin: 'B0B3N5K2D8',
        title: 'Gafas de Sol Hugo Boss BOSS 1420/S 10A BEIGE 55/18/145 Hombre',
        image: 'https://images-na.ssl-images-amazon.com/images/I/516NfJzHUqL.jpg',
        creationDate: 'Tue, 28 Jan 2025 10:24:00 GMT',
        categories: [3074590031, 2665403031],
        rootCat: 5512276031,
        lastUpdate: 'Tue, 28 Jan 2025 10:24:00 GMT',
        amazonStat: {
            currentPrice: null,
            avgDay: null,
            avgWeek: null,
            avgMonth: null,
            percentageDropDay: null,
            percentageDropWeek: null,
            percentageDropMonth: null,
            dropDay: null,
            dropWeek: null,
            dropMonth: null
        },
        newStat: {
            currentPrice: 9600,
            avgDay: 17190,
            avgWeek: 14883,
            avgMonth: 14636,
            percentageDropDay: 44,
            percentageDropWeek: 35,
            percentageDropMonth: 34,
            dropDay: 7590,
            dropWeek: 5283,
            dropMonth: 5036
        },
        buyBoxStat: {
            currentPrice: 9600,
            avgDay: null,
            avgWeek: 9600,
            avgMonth: 9601,
            percentageDropDay: null,
            percentageDropWeek: null,
            percentageDropMonth: null,
            dropDay: null,
            dropWeek: null,
            dropMonth: 1
        },
        dealOf: { '9': [1] },
        brand: 'hugo boss',
        formattedDealOf: { es: ['New'] },
        productUrls: { '9': 'https://www.amazon.es/dp/B0B3N5K2D8' },
        domains: ['9'],
        availabePriceTypes: [1],
        maxPercentageDropDay: { value: 44, priceTypes: [1] },
        maxPriceAccesors: ['newStat'],
        availablePriceAccesors: ['newStat'],
        availableDropDays: [44],
        availabeDropWeeks: [35],
        availableDropMonths: [34]
    },
    {
        asin: 'B0CCJRSGSH',
        title: 'Gafas de Sol Hugo Boss BOSS 1593/S Y11 GOLD RED 54/19/140 Mujer',
        image: 'https://images-na.ssl-images-amazon.com/images/I/41l9AMYOqPL.jpg',
        creationDate: 'Tue, 28 Jan 2025 08:54:00 GMT',
        categories: [3074620031, 88175459031],
        rootCat: 5512276031,
        lastUpdate: 'Tue, 28 Jan 2025 09:42:00 GMT',
        amazonStat: {
            currentPrice: null,
            avgDay: null,
            avgWeek: null,
            avgMonth: null,
            percentageDropDay: null,
            percentageDropWeek: null,
            percentageDropMonth: null,
            dropDay: null,
            dropWeek: null,
            dropMonth: null
        },
        newStat: {
            currentPrice: 9625,
            avgDay: 16572,
            avgWeek: 16588,
            avgMonth: 15233,
            percentageDropDay: 42,
            percentageDropWeek: 42,
            percentageDropMonth: 37,
            dropDay: 6947,
            dropWeek: 6963,
            dropMonth: 5608
        },
        buyBoxStat: {
            currentPrice: 9625,
            avgDay: 9625,
            avgWeek: 9625,
            avgMonth: 9625,
            percentageDropDay: null,
            percentageDropWeek: null,
            percentageDropMonth: null,
            dropDay: null,
            dropWeek: null,
            dropMonth: null
        },
        dealOf: { '9': [1] },
        brand: 'hugo boss',
        formattedDealOf: { es: ['New'] },
        productUrls: { '9': 'https://www.amazon.es/dp/B0CCJRSGSH' },
        domains: ['9'],
        availabePriceTypes: [1],
        maxPercentageDropDay: { value: 42, priceTypes: [1] },
        maxPriceAccesors: ['newStat'],
        availablePriceAccesors: ['newStat'],
        availableDropDays: [42],
        availabeDropWeeks: [42],
        availableDropMonths: [37]
    }
];

const analyzeDeal = (deal) => {
    const analysis = {
        isValid: true,
        reasons: [],
        score: 0,
        metrics: {},
        warnings: []
    };

    // 1. Data Validation Check
    if (!deal.newStat || !deal.buyBoxStat || !deal.amazonStat) {
        analysis.isValid = false;
        analysis.reasons.push('Incomplete price data');
        return analysis;
    }

    // 2. Extract Key Metrics
    const primaryStat = deal.maxPriceAccesors[0];
    const currentPrice = deal[primaryStat]?.currentPrice;
    const avgPrices = {
        day: deal[primaryStat]?.avgDay,
        week: deal[primaryStat]?.avgWeek,
        month: deal[primaryStat]?.avgMonth
    };

    // 3. Calculate Price Stability Metrics
    const calculateVolatility = () => {
        const values = [
            deal.newStat.percentageDropDay,
            deal.newStat.percentageDropWeek,
            deal.newStat.percentageDropMonth
        ].filter(v => v !== null);

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    };

    const volatility = calculateVolatility();
    analysis.metrics.volatility = volatility;

    // 4. Price Consistency Check
    const priceConsistencyThreshold = 15; // Percentage difference allowed
    const priceDifferences = {
        dayWeek: Math.abs(deal.newStat.percentageDropDay - deal.newStat.percentageDropWeek),
        weekMonth: Math.abs(deal.newStat.percentageDropWeek - deal.newStat.percentageDropMonth)
    };

    // 5. Deal Quality Algorithm
    const qualityChecks = {
        significantDrop: deal.maxPercentageDropDay.value >= 30,
        sustainedDrop: deal.availableDropMonths[0] >= 25,
        lowVolatility: volatility < 20,
        amazonSeller: deal.formattedDealOf[Object.keys(deal.formattedDealOf)[0]].includes('Amazon'),
        priceConsistency: priceDifferences.dayWeek < priceConsistencyThreshold &&
            priceDifferences.weekMonth < priceConsistencyThreshold
    };

    // 6. Scoring System
    analysis.score += qualityChecks.significantDrop ? 25 : 0;
    analysis.score += qualityChecks.sustainedDrop ? 20 : 0;
    analysis.score += qualityChecks.lowVolatility ? 20 : 0;
    analysis.score += qualityChecks.amazonSeller ? 25 : 0;
    analysis.score += qualityChecks.priceConsistency ? 10 : 0;

    // 7. Validation Rules
    if (!qualityChecks.significantDrop) {
        analysis.reasons.push(`Insufficient price drop (${deal.maxPercentageDropDay.value}% < 30% threshold)`);
    }

    if (!qualityChecks.sustainedDrop) {
        analysis.reasons.push(`Short-term discount (monthly drop ${deal.availableDropMonths[0]}%)`);
    }

    if (volatility >= 20) {
        analysis.warnings.push(`High price volatility (${volatility.toFixed(1)} SD)`);
    }

    if (!qualityChecks.amazonSeller) {
        analysis.warnings.push('Non-Amazon seller');
    }

    if (!qualityChecks.priceConsistency) {
        analysis.warnings.push(`Price inconsistency detected (Δday-week: ${priceDifferences.dayWeek}%, Δweek-month: ${priceDifferences.weekMonth}%)`);
    }

    // 8. Final Determination
    analysis.isValid = analysis.reasons.length === 0 && analysis.score >= 70;
    analysis.metrics = {
        ...analysis.metrics,
        currentPrice,
        avgPrices,
        priceDifferences,
        qualityChecks
    };

    return analysis;
};

console.log(analyzeDeal(deals[1]));