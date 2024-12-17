const db = require('../db');

const createConfigTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `).run();
};

const setConfig = (key, value) => {
    createConfigTable();
    db.prepare(`
        INSERT INTO config (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
};

const getConfig = (key) => {
    createConfigTable();
    const row = db.prepare('SELECT value FROM config WHERE key = ?').get(key);
    return row ? row.value : null;
};

const getAllConfigs = () => {
    createConfigTable();
    return db.prepare('SELECT * FROM config').all();
};

const deleteConfig = (key) => {
    createConfigTable();
    const result = db.prepare('DELETE FROM config WHERE key = ?').run(key);
    return result.changes > 0;
};

const resetConfig = () => {
    createConfigTable();
    db.prepare('DELETE FROM config').run();
};

module.exports = {
    setConfig,
    getConfig,
    getAllConfigs,
    deleteConfig,
    resetConfig,
};