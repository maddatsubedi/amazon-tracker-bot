const { getAvailabeLocales } = require("../../utils/helpers");
const db = require("../db");

const createBrandsTable = () => {
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            domains TEXT NOT NULL, -- Comma-separated list of domains
            tracking BOOLEAN DEFAULT 0 -- 0 for not tracking, 1 for tracking (now on brand level)
        )
    `
  ).run();
};

const createAsinsTable = () => {
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS asins (
            asin TEXT PRIMARY KEY,
            brand_id INTEGER NOT NULL,
            tracking BOOLEAN DEFAULT 0, -- 0 for not tracking, 1 for tracking (deprecated for brand-level)
            added_at TEXT NOT NULL, -- Date when the ASIN was added (ISO string format)
            expires_at TEXT, -- Date when the ASIN deal expires (optional)
            deal_created_at TEXT, -- Date when the deal was created (optional)
            type TEXT NOT NULL, -- Type of the ASIN, e.g., "normal", "deal", etc.
            FOREIGN KEY (brand_id) REFERENCES brands(id)
        )
    `
  ).run();
};

const initializeDatabase = () => {
  createBrandsTable();
  createAsinsTable();

//   if database is large, uncomment this

//   db.prepare('CREATE INDEX IF NOT EXISTS idx_brand_id ON asins (brand_id)').run();
//     db.prepare('CREATE INDEX IF NOT EXISTS idx_asin ON asins (asin)').run();
};

const insertBrand = (brandName, domains = "", tracking = 0) => {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO brands (name, domains, tracking) VALUES (?, ?, ?)"
  );
  stmt.run(brandName, domains, tracking ? 1 : 0);
  return db
    .prepare("SELECT id, domains, tracking FROM brands WHERE name = ?")
    .get(brandName);
};

const addDomainToBrand = (brandName, domain) => {
  const row = db
    .prepare("SELECT domains FROM brands WHERE name = ?")
    .get(brandName);
  if (row) {
    const currentDomains = row.domains.split(",").filter(Boolean);
    if (!currentDomains.includes(domain)) {
      currentDomains.push(domain);
      db.prepare(
        `
                UPDATE brands SET domains = ? WHERE name = ?
            `
      ).run(currentDomains.join(","), brandName);
    }
  }
};

const insertAsins = (brandName, asins, type = "normal") => {
  const brand = insertBrand(brandName);
  const duplicateAsins = [];
  const errorAsins = [];
  const successfulAsins = [];
  const stmt = db.prepare(`
        INSERT OR IGNORE INTO asins (asin, brand_id, added_at, expires_at, deal_created_at, type) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);

  const currentDate = new Date().toUTCString();
  const transaction = db.transaction((asins) => {
    asins.forEach((asin) => {
      try {
        const result = stmt.run(
          asin.asin,
          brand.id,
          currentDate,
          asin.expiresAt || null,
          asin.dealCreatedAt || null,
          asin.type || type
        );
        if (result.changes === 0) {
          duplicateAsins.push(asin.asin);
        } else {
          successfulAsins.push(asin.asin);
        }
      } catch (error) {
        console.error("Error inserting ASIN:", asin.asin, error);
        errorAsins.push({ asin: asin.asin, error: error.message });
      }
    });
  });
  transaction(asins);

  const success = successfulAsins.length > 0;

  const totalAsinsCount = db
    .prepare("SELECT COUNT(*) as count FROM asins WHERE brand_id = ?")
    .get(brand.id).count;

  return {
    success,
    successfulAsinsCount: successfulAsins.length,
    duplicateAsinsCount: duplicateAsins.length,
    errorAsinsCount: errorAsins.length,
    totalAsinsCount,
  };
};

const updatePriceLastUpdated = (asin) => {
  const currentDate = new Date().toISOString(); // Get current date in ISO string format
  db.prepare(
    `
        UPDATE asins SET added_at = ? WHERE asin = ?
    `
  ).run(currentDate, asin);
};

const setTrackingForBrand = (brandName, tracking) => {
  const brand = db
    .prepare("SELECT id FROM brands WHERE name = ?")
    .get(brandName);
  if (brand) {
    db.prepare(
      `
            UPDATE brands SET tracking = ? WHERE id = ?
        `
    ).run(tracking ? 1 : 0, brand.id);
  } else {
    console.error(`Brand '${brandName}' not found.`);
  }
};

const getAsinsForBrand = (brandName) => {
  const brand = db
    .prepare("SELECT id FROM brands WHERE name = ?")
    .get(brandName);
  if (brand) {
    return db
      .prepare(
        "SELECT asin, added_at, expires_at, deal_created_at, type FROM asins WHERE brand_id = ?"
      )
      .all(brand.id);
  }
  return [];
};

const getAllBrands = () => {
  return db.prepare("SELECT * FROM brands").all();
};

const getAllTrackedBrands = () => {
  return db.prepare("SELECT * FROM brands WHERE tracking = 1").all();
};


const brandExists = (brandName) => {
  const brand = db
    .prepare("SELECT id FROM brands WHERE name = ?")
    .get(brandName);
  return !!brand; // Returns true if the brand exists, otherwise false
};

const deleteBrandAndAsins = (brandName) => {
  const brand = db
    .prepare("SELECT id FROM brands WHERE name = ?")
    .get(brandName);
  if (brand) {
    db.prepare("DELETE FROM asins WHERE brand_id = ?").run(brand.id);
    db.prepare("DELETE FROM brands WHERE id = ?").run(brand.id);
  }
};

const getBrandDomains = async (brandName) => {
  const brand = db
    .prepare("SELECT domains FROM brands WHERE name = ?")
    .get(brandName);
  return brand ? brand.domains.split(",").filter(Boolean) : [];
};

module.exports = {
  createBrandsTable,
  createAsinsTable,
  insertBrand,
  addDomainToBrand,
  insertAsins,
  updatePriceLastUpdated,
  setTrackingForBrand,
  getAsinsForBrand,
  getAllBrands,
  brandExists,
  deleteBrandAndAsins,
  getBrandDomains,
  initializeDatabase,
  getAllTrackedBrands
};
