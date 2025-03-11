const db = require('./database/db');
const { getGuildConfig, resetGuildConfig } = require('./database/models/guildConfig');

const { addSubscription, getSubscription } = require('./database/models/subscription');

// db.prepare('DELETE FROM guildconfig WHERE key = ?').run("forwardConfig");