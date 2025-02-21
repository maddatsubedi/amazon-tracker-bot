const { removeExpiredRoles } = require("../database/models/subscription");
const { initPolling } = require("../tracking/polling");
const { runExpiredSubscriptionsRemoval } = require("./discordUtils");
const { dbSetup } = require("./dbSetup");

const setupBotInit = async (client) => {

    dbSetup();
    initPolling(client);
    runExpiredSubscriptionsRemoval(client);

};

module.exports = {
    setupBotInit
}