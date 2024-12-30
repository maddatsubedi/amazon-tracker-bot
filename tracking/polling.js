const { parseTimeToMilliseconds } = require('../utils/helpers');
const { setup, createSchedule } = require('../utils/keepaDealsApi');


function initPolling(client) {
    setup();
    createSchedule(client, parseTimeToMilliseconds('10 sec'));
}

// initPolling();

module.exports = {
    initPolling
}