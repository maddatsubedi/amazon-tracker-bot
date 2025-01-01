const { setIsPolling, unsetIsPolling } = require('../database/models/config');
const { parseTimeToMilliseconds } = require('../utils/helpers');
const { setup, pollingMain } = require('../utils/keepaDealsApi');

async function initPolling(client) {
    setIsPolling();
    setup();
    const result = await pollingMain(client, parseTimeToMilliseconds('10 sec'));
    if (result.abort) {
        unsetIsPolling();
    }
}

module.exports = {
    initPolling
}