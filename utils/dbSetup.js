const { createSubscriptionTable } = require('../database/models/subscription');
const { createGuildConfigTable } = require('../database/models/guildConfig');
const { createConfigTable } = require('../database/models/config');
const { initializeBrandsAndAsins } = require('../database/models/asins');
const { createPriceRangeTable } = require('../database/models/discount_range');
const { createSubscriptionRolesTable } = require('../database/models/subscriptionRoles');


const dbSetup = async () => {
    createSubscriptionTable();
    initializeBrandsAndAsins();
    createGuildConfigTable();
    createConfigTable();
    createPriceRangeTable();
    createSubscriptionRolesTable();
}

module.exports = {
    dbSetup
}