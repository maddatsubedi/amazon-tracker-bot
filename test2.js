const { setTrackingForBrand } = require("./database/models/asins");
const { parseTimeToMilliseconds, calculateTokensRefillTime, formatKeepaDate, validateRange } = require("./utils/helpers");

// setTrackingForBrand('nike', false);

// console.log(parseTimeToMilliseconds('1 min'));

const arr = ['1-2', '2-9', '10-50', '3-4', '5-6'];

const validArr = arr.filter((item) => validateRange(item).valid);

const customValidArr = arr.filter((iP) => iP.split('-').map(i => Number(i))[0] < iP.split('-').map(i => Number(i))[iP.split('-').length-1]);

// console.log(validArr);
// console.log(customValidArr);

const [min, max] = [...new Set(validArr.map(i => i.split('-')).flat(1))].map(i => Number(i)).sort((a, b) => a - b).filter((i, iN, ar) => iN === 0 || iN === ar.length - 1);
console.log(min);
console.log(max);