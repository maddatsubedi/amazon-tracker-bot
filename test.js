const db = require('./database/db');
const { getGuildConfig } = require('./database/models/guildConfig');

const { addSubscription } = require('./database/models/subscription');

// db.prepare("DROP TABLE subscription").run();