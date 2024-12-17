const db = require('../db');

const createPriceRangeTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS discount_range (
            range TEXT PRIMARY KEY,
            channelId TEXT NOT NULL
        )
    `).run();
};

const setRange = (range, channelId) => {
    createPriceRangeTable();
    db.prepare(`
        INSERT INTO discount_range (range, channelId) VALUES (?, ?)
        ON CONFLICT(range) DO UPDATE SET channelId = excluded.channelId
    `).run(range, channelId);
};

const getChannelId = (range) => {
    createPriceRangeTable();
    const row = db.prepare('SELECT channelId FROM discount_range WHERE range = ?').get(range);
    return row ? row.channelId : null;
};

const getAllRanges = () => {
    createPriceRangeTable();
    return db.prepare('SELECT * FROM discount_range').all();
};

const deleteRange = (range) => {
    createPriceRangeTable();
    const result = db.prepare('DELETE FROM discount_range WHERE range = ?').run(range);
    return result.changes > 0;
};

const resetRanges = () => {
    createPriceRangeTable();
    db.prepare('DELETE FROM discount_range').run();
};

module.exports = {
    setRange,
    getChannelId,
    getAllRanges,
    deleteRange,
    resetRanges,
};
