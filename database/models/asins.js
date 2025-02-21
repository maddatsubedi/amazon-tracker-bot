const { getAvailabeLocales, formatKeepaDate } = require("../../utils/helpers");
const db = require("../db");

const createBrandsTable = () => {
  db.prepare(
    `
        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            domains TEXT NOT NULL, -- Comma-separated list of domains
            channel_id TEXT NOT NULL, -- Channel ID to send notifications to
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
            added_at TEXT NOT NULL, -- Date when the ASIN was added (ISO string format)
            expires_at TEXT, -- Date when the ASIN deal expires (optional)
            deal_created_at TEXT, -- Date when the deal was created (optional)
            type TEXT NOT NULL, -- Type of the ASIN, e.g., "normal", "deal", etc.
            FOREIGN KEY (brand_id) REFERENCES brands(id)
        )
    `
  ).run();
};

const initializeBrandsAndAsins = () => {
  createBrandsTable();
  createAsinsTable();

  //   if database is large, uncomment this

  //   db.prepare('CREATE INDEX IF NOT EXISTS idx_brand_id ON asins (brand_id)').run();
  //     db.prepare('CREATE INDEX IF NOT EXISTS idx_asin ON asins (asin)').run();
};

const insertBrand = (brandName, domains = "", tracking = 0, channelID) => {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO brands (name, domains, channel_id, tracking) VALUES (?, ?, ?, ?)"
  );
  stmt.run(brandName, domains, channelID, tracking ? 1 : 0);
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

const insertAsins = (brand_id, deals, expiresAt, type = "normal") => {
  const duplicateAsins = [];
  const errorAsins = [];
  const successfulAsins = [];
  const stmt = db.prepare(`
        INSERT OR IGNORE INTO asins (asin, brand_id, added_at, expires_at, deal_created_at, type) 
        VALUES (?, ?, ?, ?, ?, ?)
    `);

  const currentDate = new Date().toUTCString();
  const transaction = db.transaction((deals) => {
    deals.forEach((deal) => {
      try {
        const result = stmt.run(
          deal.asin,
          brand_id,
          currentDate,
          expiresAt,
          formatKeepaDate(deal.creationDate),
          type
        );
        if (result.changes === 0) {
          duplicateAsins.push(deal.asin);
        } else {
          successfulAsins.push(deal.asin);
        }
      } catch (error) {
        console.error("Error inserting ASIN:", deal.asin, error);
        errorAsins.push({ asin: deal.asin, error: error.message });
      }
    });
  });

  transaction(deals);

  const success = successfulAsins.length > 0;

  const totalAsinsCount = db
    .prepare("SELECT COUNT(*) as count FROM asins WHERE brand_id = ?")
    .get(brand_id).count;

  return {
    success,
    successfulAsinsCount: successfulAsins.length,
    duplicateAsinsCount: duplicateAsins.length,
    errorAsinsCount: errorAsins.length,
    totalAsinsCount,
    successfulAsins,
  };
};

const insertSingleAsin = (asin, brandId, addedAt, expiresAt, createdAt, type = "normal") => {
  const stmt = db.prepare(`
        INSERT OR IGNORE INTO asins (asin, brand_id, added_at, expires_at, deal_created_at, type)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

  try {
    const result = stmt.run(
      asin,
      brandId,
      addedAt,
      expiresAt,
      createdAt,
      type
    );
    if (result.changes === 0) {
      return 'DUPLICATE';
    } else {
      return 'SUCCESS';
    }
  } catch (error) {
    console.error("Error inserting ASIN:", deal.asin, error);
    return 'ERROR';
  }
}

const removeExpiredAsins = (type = null) => {
  const currentDate = new Date();

  // Query for expired ASINs with optional type filtering
  const expiredAsinsQuery = `
    SELECT asin, expires_at FROM asins
    WHERE expires_at IS NOT NULL ${type ? "AND type = ?" : ""}
  `;

  const expiredAsins = db.prepare(expiredAsinsQuery).all(type ? [type] : []);

  const expiredAsinsToDelete = expiredAsins.filter((asinData) => {
    const expiresAtDate = new Date(asinData.expires_at);
    return expiresAtDate < currentDate;
  });

  if (expiredAsinsToDelete.length > 0) {
    const expiredAsinsList = expiredAsinsToDelete.map((asinData) => asinData.asin);
    db.prepare(
      `DELETE FROM asins WHERE asin IN (${expiredAsinsList.map(() => "?").join(",")})`
    ).run(...expiredAsinsList);
  }

  return expiredAsinsToDelete;
};

const updatePriceLastUpdated = (asin) => {
  const currentDate = new Date().toISOString();
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

const getAsinsForBrand = (brandName, type = null) => {
  const brand = db
    .prepare("SELECT id FROM brands WHERE name = ?")
    .get(brandName);
  if (brand) {
    const asinsQuery = `
      SELECT * FROM asins WHERE brand_id = ? ${type ? "AND type = ?" : ""}
    `;
    return db.prepare(asinsQuery).all(type ? [brand.id, type] : [brand.id]);
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

const getBrandDomains = (brandName) => {
  const brand = db
    .prepare("SELECT domains FROM brands WHERE name = ?")
    .get(brandName);
  return brand ? brand.domains.split(",").filter(Boolean) : [];
};

const getBrandFromName = (brandName) => {
  return db.prepare("SELECT * FROM brands WHERE name = ?").get(brandName);
}

const getAllAsins = (type = null) => {
  const asinsQuery = `
    SELECT * FROM asins ${type ? "WHERE type = ?" : ""}
  `;
  return db.prepare(asinsQuery).all(type ? [type] : []);
}

module.exports = {
  createBrandsTable,
  createAsinsTable,
  insertBrand,
  addDomainToBrand,
  insertAsins,
  removeExpiredAsins,
  updatePriceLastUpdated,
  setTrackingForBrand,
  getAsinsForBrand,
  getAllBrands,
  brandExists,
  deleteBrandAndAsins,
  getBrandDomains,
  initializeBrandsAndAsins,
  getAllTrackedBrands,
  getBrandFromName,
  insertSingleAsin,
  getAllAsins,
};
