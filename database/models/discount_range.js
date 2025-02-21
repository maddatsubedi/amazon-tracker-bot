const db = require('../db');

const createPriceRangeTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS discount_range (
            range TEXT PRIMARY KEY,
            roleID TEXT NOT NULL
        )
    `).run();
};

const setRange = (range, roleID) => {
    db.prepare(`
        INSERT INTO discount_range (range, roleID) VALUES (?, ?)
    `).run(range, roleID);
};

const updateRange = (range, roleID) => {
    db.prepare(`
        UPDATE discount_range SET roleID = ? WHERE range = ?
    `).run(roleID, range);
};

const getRangeDetails = (range) => {
    const row = db.prepare('SELECT roleID FROM discount_range WHERE range = ?').get(range);
    return row || null;
};

const getAllRanges = () => {
    return db.prepare('SELECT * FROM discount_range').all();
};

const deleteRange = (range) => {
    const result = db.prepare('DELETE FROM discount_range WHERE range = ?').run(range);
    return result.changes > 0;
};

const resetRanges = () => {
    db.prepare('DELETE FROM discount_range').run();
};

const getRange = (range) => {
    return db.prepare('SELECT * FROM discount_range WHERE range = ?').get(range);
};

const getRangeForDiscount = (discount) => {
    const discountRanges = db.prepare('SELECT * FROM discount_range').all();

    const range = discountRanges.find(range => {
        const [i, f] = range.range.split('-').map(Number);
        return discount >= i && discount < f;
    });

    return range;
};

module.exports = {
    createPriceRangeTable,
    setRange,
    updateRange,
    getRangeDetails,
    getAllRanges,
    deleteRange,
    resetRanges,
    getRange,
    getRangeForDiscount
};