const db = require('./database/db');

// drop table brands
db.prepare('DROP TABLE IF EXISTS discount_range').run();