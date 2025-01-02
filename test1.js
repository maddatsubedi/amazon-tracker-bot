const db = require('./database/db');
const { removeExpiredAsins } = require('./database/models/asins');

// drop table brands
// db.prepare('DROP TABLE IF EXISTS discount_range').run();

const expiresAt = new Date(new Date().setDate(new Date().getDate() - 2)).toUTCString();
const addedAt = new Date().toUTCString();
const dealCreatedAt = new Date().toUTCString();
const types = 'deal'

const asin = {
    asin: 'expire',
    brand_id: 1,
    added_at: addedAt,
    expires_at: expiresAt,
}

const insert = () => {
    db.prepare(`
        INSERT OR IGNORE INTO asins (asin, brand_id, added_at, expires_at, deal_created_at, type) 
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(asin.asin, asin.brand_id, asin.added_at, asin.expires_at, dealCreatedAt, types);
}

const removeAsin = (asin) => {
    db.prepare(`
        DELETE FROM asins WHERE asin = ?
    `).run(asin);
}

insert();
// removeExpiredAsins();
// removeAsin('B0CD87CQCG');