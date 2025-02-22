const db = require("../db");

const createSubscriptionRolesTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS subscriptionRoles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            UNIQUE(guild_id, role_id)
        )
    `).run();
}

const getSubscriptionRoles = (guild_id) => {
    return db.prepare('SELECT * FROM subscriptionRoles WHERE guild_id = ?').all(guild_id);
}

const addSubscriptionRole = (guild_id, role_id) => {
    db.prepare(`
        INSERT INTO subscriptionRoles (guild_id, role_id) VALUES (?, ?)
    `).run(guild_id, role_id);
}

const addBulkSubscriptionRoles = (guild_id, role_ids) => {
    const existingRoles = getSubscriptionRoles(guild_id);
    const existingRoleIds = existingRoles.map(role => role.role_id);
    const newRoles = role_ids.filter(role_id => !existingRoleIds.includes(role_id));
    const duplicates = role_ids.filter(role_id => existingRoleIds.includes(role_id));
    const errors = [];
    const successful = [];

    const stmt = db.prepare('INSERT INTO subscriptionRoles (guild_id, role_id) VALUES (?, ?)');

    newRoles.forEach(role_id => {
        try {
            const result = stmt.run(guild_id, role_id);
            if (result.changes > 0) {
                successful.push(role_id);
            }
        } catch (error) {
            errors.push(role_id);
        }
    });

    return {
        successful,
        newRoles,
        duplicates,
        errors
    };
}

const removeSubscriptionRole = (guild_id, role_id) => {
    const result = db.prepare('DELETE FROM subscriptionRoles WHERE guild_id = ? AND role_id = ?').run(guild_id, role_id);
    return result.changes > 0;
}

const clearSubscriptionRoles = (guild_id) => {
    const result = db.prepare('DELETE FROM subscriptionRoles WHERE guild_id = ?').run(guild_id);
    return result.changes > 0;
}

module.exports = {
    createSubscriptionRolesTable,
    getSubscriptionRoles,
    addSubscriptionRole,
    removeSubscriptionRole,
    addBulkSubscriptionRoles,
    clearSubscriptionRoles
};