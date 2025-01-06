const { calculateTokensRefillTime, parseTimeToMilliseconds, formatTime } = require("./utils/helpers");

const newDealsCount = 20;
const requiredTokensForNoti = ((newDealsCount * 2) + 5);
const refillRate = 20; // 25
const refillIn = 1200;
const tokensLeft = 5;

const refillTime = calculateTokensRefillTime(refillRate, refillIn, tokensLeft, requiredTokensForNoti);
const refillTimeInMs = parseTimeToMilliseconds(refillTime);

// console.log("refillTime", refillTime);
// console.log("refillTimeInMs", refillTimeInMs);

console.log(formatTime(120000));