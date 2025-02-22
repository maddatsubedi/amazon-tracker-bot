const db = require("../db");

const createSubscriptionTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS subscription (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            added_at TEXT NOT NULL,
            duration TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
    `).run();
};

const addSubscription = (user_id, guild_id, added_at, duration, expires_at) => {
    db.prepare(`
        INSERT INTO subscription (user_id, guild_id, added_at, duration, expires_at) VALUES (?, ?, ?, ?, ?)
    `).run(user_id, guild_id, added_at, duration, expires_at);
};

const getSubscription = (user_id, guild_id) => {
    return db.prepare('SELECT * FROM subscription WHERE user_id = ? AND guild_id = ?').get(user_id, guild_id);
}

const removeSubscription = (user_id, guild_id) => {
    const result = db.prepare('DELETE FROM subscription WHERE user_id = ? AND guild_id = ?').run(user_id, guild_id);
    // console.log(result);
    return result.changes > 0;
};

const deleteAllSubscriptions = (user_id, guild_id) => {
    const result = db.prepare('DELETE FROM subscription WHERE user_id = ? AND guild_id = ?').run(user_id, guild_id);
    return result.changes > 0;
};

const getAllSubscriptions = () => {
    return db.prepare('SELECT * FROM subscription').all();
};

const getAllGuildSubscriptions = (guild_id) => {
    return db.prepare('SELECT * FROM subscription WHERE guild_id = ?').all(guild_id);
};

const removeExpiredSubscriptions = () => {
    const currentTime = new Date();
    const subscription = getAllSubscriptions();

    const expiredSubscriptions = subscription.filter(subscription => new Date(subscription.expires_at) < currentTime);
    const deletedSubscriptions = [];

    expiredSubscriptions.forEach(subscription => {
        removeSubscription(subscription.user_id, subscription.guild_id);
        deletedSubscriptions.push(subscription);
    });

    return {
        expiredSubscriptions,
        deletedSubscriptions
    }
};

module.exports = {
    createSubscriptionTable,
    addSubscription,
    removeSubscription,
    deleteAllSubscriptions,
    removeExpiredSubscriptions,
    getAllSubscriptions,
    getSubscription,
    getAllGuildSubscriptions
};