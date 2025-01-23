const { setIsPolling, unsetIsPolling, isPolling } = require('../database/models/config');
const { parseTimeToMilliseconds } = require('../utils/helpers');
const { setupPolling, pollingMain } = require('../utils/keepaDealsApi');

async function initPolling(client) {
    setIsPolling();
    setupPolling();
    const result = await pollingMain(client);
    if (result.abort) {
        unsetIsPolling();
    }
    return result;
}

async function reInitPolling(client) {
    if (!isPolling()) {
        const result = await initPolling(client);
        return result;
    } else {
        return {
            abort: "POLLING_ALREADY_RUNNING",
            abortMessage: "Polling is already running"
        };
    }
}

module.exports = {
    initPolling,
    reInitPolling
}