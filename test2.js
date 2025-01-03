const { setTrackingForBrand } = require("./database/models/asins");
const { parseTimeToMilliseconds, calculateTokensRefillTime } = require("./utils/helpers");

setTrackingForBrand('nike', false);

// console.log(parseTimeToMilliseconds('1 min'));