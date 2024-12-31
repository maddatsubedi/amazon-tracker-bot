const { calculateTokensRefillTime, parseTimeToMilliseconds } = require("./utils/helpers");

const refillRate = 20;
const refillIn = 1486;
const tokensLeft = 89;
const requiredTokens = 100;

const refillTime = calculateTokensRefillTime(refillRate, refillIn, tokensLeft, requiredTokens);
const refillTimeInMs = parseTimeToMilliseconds(refillTime);

console.log(refillTime);
console.log(refillTimeInMs);