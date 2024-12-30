const db = require('./database/db');

// drop table asins
db.prepare("DROP TABLE IF EXISTS asins").run();