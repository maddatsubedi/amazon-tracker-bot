const db = require('../db');

const createPriceRangeTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS discount_range (
            range TEXT PRIMARY KEY,
            channelID TEXT NOT NULL,
            roleID TEXT NOT NULL
        )
    `).run();
};

const setRange = (range, channelID, roleID) => {
    createPriceRangeTable();
    db.prepare(`
        INSERT INTO discount_range (range, channelID, roleID) VALUES (?, ?, ?)
    `).run(range, channelID, roleID);
};

const updateRange = (range, channelID, roleID) => {
    createPriceRangeTable();
    db.prepare(`
        UPDATE discount_range SET channelID = ?, roleID = ? WHERE range = ?
    `).run(channelID, roleID, range);
};

const getChannelAndRole = (range) => {
    createPriceRangeTable();
    const row = db.prepare('SELECT channelID, roleID FROM discount_range WHERE range = ?').get(range);
    return row || null;
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

const getRange = (range) => {
    createPriceRangeTable();
    return db.prepare('SELECT * FROM discount_range WHERE range = ?').get(range);
};

const getRangeForDiscount = (discount) => {
    createPriceRangeTable();
    const discountRanges = db.prepare('SELECT * FROM discount_range').all();

    const range = discountRanges.find(range => {
        const [i, f] = range.range.split('-').map(Number);
        return discount >= i && discount < f;
    });

    return range;
};

module.exports = {
    setRange,
    updateRange,
    getChannelAndRole,
    getAllRanges,
    deleteRange,
    resetRanges,
    getRange,
    getRangeForDiscount
};