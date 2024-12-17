const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir);
}

const dbPath = path.join(storageDir, 'storage.db');

const db = new Database(dbPath);

module.exports = db;