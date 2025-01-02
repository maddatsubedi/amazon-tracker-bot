const { setIsPolling, unsetIsPolling, isPolling } = require('../database/models/config');
const { parseTimeToMilliseconds } = require('../utils/helpers');
const { setup, pollingMain } = require('../utils/keepaDealsApi');

async function initPolling(client) {
    setIsPolling();
    setup();
    const result = await pollingMain(client);
    if (result.abort) {
        unsetIsPolling();
    }
}

function reInitPolling(client) {
    if (!isPolling()) {
        initPolling(client);
    }
}

module.exports = {
    initPolling,
    reInitPolling
}