const db = require('./database/db');
const { getGuildConfig, resetGuildConfig } = require('./database/models/guildConfig');

const { addSubscription, getSubscription } = require('./database/models/subscription');

// db.prepare("DROP TABLE subscriptionRoles").run();
// resetGuildConfig("1312403263643189310");