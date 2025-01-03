const { insertAsin } = require("./utils/apiHelpers");

const data = {
    asin: 'B00QZ8K0N8',
    title: 'Cordones planos de colores para zapatillas y botas de fútbol. Adecuados para todas las marcas incluyendo Nike, Adidas, Converse, Puma, Vans y Reebok. Para adultos y niños, color Gris, talla 60 cm',
    image: [
        56, 49, 86, 79, 54, 120,
        45, 111, 75, 86, 76, 46,
        106, 112, 103
    ],
    creationDate: 7365512,
    categories: [2007962031],
    rootCat: 5512276031,
    lastUpdate: 7367194,
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
        currentPrice: 222,
        avgDay: 447,
        avgWeek: 683,
        avgMonth: 357,
        percentageDropDay: 50,
        percentageDropWeek: 67,
        percentageDropMonth: 38,
        dropDay: 225,
        dropWeek: 461,
        dropMonth: 135
    },
    buyBoxStat: {
        currentPrice: 471,
        avgDay: 471,
        avgWeek: 669,
        avgMonth: 500,
        percentageDropDay: null,
        percentageDropWeek: 30,
        percentageDropMonth: 6,
        dropDay: null,
        dropWeek: 198,
        dropMonth: 29
    },
    dealOf: { '9': [1] },
    brand: 'nike'
}

const addAsin = insertAsin('nike', data, 'deal');
console.log(addAsin);