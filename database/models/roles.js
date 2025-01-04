const db = require('../db');

const createRolesTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            added_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
    `).run();
};

const setupRolesDB = () => {
    createRolesTable();
}

const addRole = (user_id, role_id, added_at, expires_at) => {
    db.prepare(`
        INSERT INTO roles (user_id, role_id, added_at, expires_at) VALUES (?, ?, ?, ?)
    `).run(user_id, role_id, added_at, expires_at);
};

const getRoles = (user_id) => {
    return db.prepare('SELECT * FROM roles WHERE user_id = ?').all(user_id);
};

const getRole = (user_id, role_id) => {
    return db.prepare('SELECT * FROM roles WHERE user_id = ? AND role_id = ?').get(user_id, role_id);
}

const removeRole = (user_id, role_id) => {
    const result = db.prepare('DELETE FROM roles WHERE user_id = ? AND role_id = ?').run(user_id, role_id);
    // console.log(result);
    return result.changes > 0;
};

const deleteAllRoles = (user_id) => {
    const result = db.prepare('DELETE FROM roles WHERE user_id = ?').run(user_id);
    return result.changes > 0;
};

const getAllRoles = () => {
    return db.prepare('SELECT * FROM roles').all();
};

const checkDBRole = (user_id, role_id) => {
    const result = db.prepare('SELECT * FROM roles WHERE user_id = ? AND role_id = ?').get(user_id, role_id);
    return result ? true : false;
};

const removeExpiredRoles = () => {
    const currentTime = new Date();
    const roles = getAllRoles();

    const expiredRoles = roles.filter(role => new Date(role.expires_at) < currentTime);
    const deletedRoles = [];

    expiredRoles.forEach(role => {
        removeRole(role.user_id, role.role_id);
        deletedRoles.push(role);
    });

    return {
        expiredRoles,
        deletedRoles
    }
};

module.exports = {
    addRole,
    getRoles,
    removeRole,
    deleteAllRoles,
    setupRolesDB,
    removeExpiredRoles,
    getAllRoles,
    checkDBRole,
    getRole
};