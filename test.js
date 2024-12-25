const db = require('./database/db');

// drop asins table
// db.prepare('DROP TABLE IF EXISTS asins').run();

const PER_PAGE = 223;
const brandDomains = [ '3', '4', '8', '9'];
const tokensRequired = (10 + (1/100) * PER_PAGE) * brandDomains.length;

console.log(tokensRequired);
