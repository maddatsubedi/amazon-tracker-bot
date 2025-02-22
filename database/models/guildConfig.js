const db = require('../db');

const createGuildConfigTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS guildconfig (
            guildId TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            PRIMARY KEY (guildId, key)
        )
    `).run();
};

const setGuildConfig = (guildId, key, value) => {
    db.prepare(`
        INSERT INTO guildconfig (guildId, key, value) 
        VALUES (?, ?, ?) 
        ON CONFLICT(guildId, key) DO UPDATE SET value = excluded.value
    `).run(guildId, key, value);
};

const getGuildConfig = (guildId, key) => {
    const row = db.prepare('SELECT value FROM guildconfig WHERE guildId = ? AND key = ?').get(guildId, key);
    return row ? row.value : null;
};

const getAllGuildConfigs = (guildId) => {
    return db.prepare('SELECT key, value FROM guildconfig WHERE guildId = ?').all(guildId);
};

const deleteGuildConfig = (guildId, key) => {
    const result = db.prepare('DELETE FROM guildconfig WHERE guildId = ? AND key = ?').run(guildId, key);
    return result.changes > 0;
};

const resetGuildConfig = (guildId) => {
    db.prepare('DELETE FROM guildconfig WHERE guildId = ?').run(guildId);
};

module.exports = {
    createGuildConfigTable,
    setGuildConfig,
    getGuildConfig,
    getAllGuildConfigs,
    deleteGuildConfig,
    resetGuildConfig
};
