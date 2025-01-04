const { setupRolesDB, removeExpiredRoles } = require("../database/models/roles");
const { initPolling } = require("../tracking/polling");
const { runExpiredRolesRemoval } = require("./discordUtils");

const setupBotInit = async (client) => {
    
    initPolling(client);
    runExpiredRolesRemoval(client);

};

module.exports = {
    setupBotInit
}