const { getAvailabeLocales } = require('../../utils/helpers');
const db = require('../db');

const createBrandsTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            domains TEXT NOT NULL -- Comma-separated list of domains
        )
    `).run();
};

const createAsinsTable = () => {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS asins (
            asin TEXT PRIMARY KEY,
            brand_id INTEGER NOT NULL,
            tracking BOOLEAN DEFAULT 0, -- 0 for not tracking, 1 for tracking
            last_price_updated TEXT, -- Date when the price was last updated (ISO string format)
            FOREIGN KEY (brand_id) REFERENCES brands(id)
        )
    `).run();
};

const insertBrand = (brandName, domains = '') => {
    createBrandsTable();
    const stmt = db.prepare('INSERT OR IGNORE INTO brands (name, domains) VALUES (?, ?)');
    stmt.run(brandName, domains);
    return db.prepare('SELECT id, domains FROM brands WHERE name = ?').get(brandName);
};

const addDomainToBrand = (brandName, domain) => {
    createBrandsTable();
    createAsinsTable();
    const row = db.prepare('SELECT domains FROM brands WHERE name = ?').get(brandName);
    if (row) {
        const currentDomains = row.domains.split(',').filter(Boolean);
        if (!currentDomains.includes(domain)) {
            currentDomains.push(domain);
            db.prepare(`
                UPDATE brands SET domains = ? WHERE name = ?
            `).run(currentDomains.join(','), brandName);
        }
    }
};

const insertAsins = (brandName, asins) => {
    createBrandsTable();
    createAsinsTable();

    const brand = insertBrand(brandName);
    const duplicateAsins = [];
    const errorAsins = [];
    const successfulAsins = [];
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO asins (asin, brand_id, last_price_updated) VALUES (?, ?, ?)
    `);

    const currentDate = new Date().toISOString(); // Current date in ISO string format

    asins.forEach((asin) => {
        try {
            const result = stmt.run(asin, brand.id, currentDate);
            if (result.changes === 0) {
                duplicateAsins.push(asin);
            } else {
                successfulAsins.push(asin);
            }
        } catch (error) {
            console.error('Error inserting ASIN:', asin, error);
            errorAsins.push({ asin, error: error.message });
        }
    });

    const success = successfulAsins.length > 0;

    const totalAsinsCount = db.prepare('SELECT COUNT(*) as count FROM asins').get().count;

    return {
        success,
        successfulAsinsCount: successfulAsins.length,
        duplicateAsinsCount: duplicateAsins.length,
        errorAsinsCount: errorAsins.length,
        totalAsinsCount,
    };
};

const updateTrackingStatus = (asin, tracking) => {
    createAsinsTable();
    db.prepare(`
        UPDATE asins SET tracking = ? WHERE asin = ?
    `).run(tracking ? 1 : 0, asin);
};

const updatePriceLastUpdated = (asin) => {
    createAsinsTable();
    const currentDate = new Date().toISOString(); // Get current date in ISO string format
    db.prepare(`
        UPDATE asins SET last_price_updated = ? WHERE asin = ?
    `).run(currentDate, asin);
};

const setTrackingForBrand = (brandName, tracking) => {
    createBrandsTable();
    createAsinsTable();
    const brand = db.prepare('SELECT id FROM brands WHERE name = ?').get(brandName);
    if (brand) {
        db.prepare(`
            UPDATE asins SET tracking = ? WHERE brand_id = ?
        `).run(tracking ? 1 : 0, brand.id);
    } else {
        console.error(`Brand '${brandName}' not found.`);
    }
};

const getAsinsForBrand = (brandName) => {
    createAsinsTable();
    createBrandsTable();
    const brand = db.prepare('SELECT id FROM brands WHERE name = ?').get(brandName);
    if (brand) {
        return db.prepare('SELECT asin, tracking, last_price_updated FROM asins WHERE brand_id = ?').all(brand.id);
    }
    return [];
};

const getAllBrands = () => {
    createBrandsTable();
    return db.prepare('SELECT * FROM brands').all();
};

const brandExists = (brandName) => {
    createBrandsTable();
    const brand = db.prepare('SELECT id FROM brands WHERE name = ?').get(brandName);
    return !!brand; // Returns true if the brand exists, otherwise false
};

const deleteBrandAndAsins = (brandName) => {
    createBrandsTable();
    createAsinsTable();

    const brand = db.prepare('SELECT id FROM brands WHERE name = ?').get(brandName);
    if (brand) {
        db.prepare('DELETE FROM asins WHERE brand_id = ?').run(brand.id);
        db.prepare('DELETE FROM brands WHERE id = ?').run(brand.id);
    }
};

const getBrandDomains = async (brandName) => {
    createBrandsTable();
    const brand = db.prepare('SELECT domains FROM brands WHERE name = ?').get(brandName);
    return brand ? brand.domains.split(',').filter(Boolean) : [];
};

module.exports = {
    createBrandsTable,
    createAsinsTable,
    insertBrand,
    addDomainToBrand,
    insertAsins,
    updateTrackingStatus,
    updatePriceLastUpdated, // Add this function to the exports
    setTrackingForBrand,
    getAsinsForBrand,
    getAllBrands,
    brandExists,
    deleteBrandAndAsins,
    getBrandDomains,
};