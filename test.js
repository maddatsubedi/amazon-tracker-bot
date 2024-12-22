const db = require('./database/db');

db.prepare('DROP TABLE IF EXISTS brands').run();