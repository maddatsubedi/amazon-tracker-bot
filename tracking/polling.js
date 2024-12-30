const { parseTimeToMilliseconds } = require('../utils/helpers');
const { setup, pollingMain } = require('../utils/keepaDealsApi');


function initPolling(client) {
    setup();
    pollingMain(client, parseTimeToMilliseconds('10 sec'));
}

module.exports = {
    initPolling
}