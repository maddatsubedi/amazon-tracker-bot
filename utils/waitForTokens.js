const { getTokensData } = require("./apiHelpers");
const { calculateTokensRefillTime, parseTimeToMilliseconds } = require("./helpers");

const defaultBallbackInterval = 2500; // 2.5 seconds

const waitForTokensTarget = async (targetTokens, fallBackInterval = defaultBallbackInterval) => {
    let tokenData = await getTokensData();
    let tokensLeft = tokenData.tokensLeft;
    let refillRate = tokenData.refillRate;
    let refillIn = tokenData.refillIn;

    const refillTokens = async () => {
        let tokenData = await getTokensData();
        tokensLeft = tokenData.tokensLeft;
        refillRate = tokenData.refillRate;
        refillIn = tokenData.refillIn;
    };

    await refillTokens();

    if (tokensLeft >= targetTokens) {
        return {
            tokensLeft
        }
    }

    const refillTime = calculateTokensRefillTime(refillRate, refillIn, tokensLeft, targetTokens);
    const refillTimeInMs = parseTimeToMilliseconds(refillTime);

    await new Promise(resolve => setTimeout(resolve, (refillTimeInMs + fallBackInterval)));

    // Recursively check for tokens
    return waitForTokensTarget(targetTokens);

}

module.exports = {
    waitForTokensTarget
}