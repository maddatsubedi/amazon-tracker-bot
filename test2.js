const { setTrackingForBrand } = require("./database/models/asins");
const { parseTimeToMilliseconds, calculateTokensRefillTime, formatKeepaDate } = require("./utils/helpers");

// setTrackingForBrand('nike', false);

// console.log(parseTimeToMilliseconds('1 min'));