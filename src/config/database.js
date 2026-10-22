const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(__dirname, '../../', process.env.DATABASE_PATH)
  : path.resolve(dbDir, 'caletracker.sqlite');

const db = new DatabaseSync(dbPath);

function initDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Ensure is_verified column exists if table existed previously
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasVerified = tableInfo.some(col => col.name === 'is_verified');
    if (!hasVerified) {
      db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0;");
    }
  } catch (err) {
    console.error('Migration notice:', err.message);
  }

  // Create deals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      discount INTEGER NOT NULL,
      platform TEXT NOT NULL,
      category TEXT NOT NULL,
      ends TEXT NOT NULL,
      author TEXT NOT NULL,
      user_id INTEGER,
      original_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      deal_url TEXT DEFAULT '',
      description TEXT DEFAULT '',
      upvotes INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Seed default users and deals if not present
  seedInitialData();
}

function seedInitialData() {
  const salt = bcrypt.genSaltSync(10);

  // 1. Admin Account
  let adminId = null;
  const adminCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@caletracker.com');
  if (!adminCheck) {
    const hash = bcrypt.hashSync('admin123', salt);
    const res = db.prepare(`
      INSERT INTO users (name, email, password, role, is_verified)
      VALUES (?, ?, ?, 'admin', 1)
    `).run('CaleTracker Admin', 'admin@caletracker.com', hash);
    adminId = res.lastInsertRowid;
  } else {
    adminId = adminCheck.id;
    db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(adminId);
  }

  // 2. Verified Normal User Account
  let verifiedUserId = null;
  const verifiedCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('verified@caletracker.com');
  if (!verifiedCheck) {
    const hash = bcrypt.hashSync('verified123', salt);
    const res = db.prepare(`
      INSERT INTO users (name, email, password, role, is_verified)
      VALUES (?, ?, ?, 'user', 1)
    `).run('Verified Hunter', 'verified@caletracker.com', hash);
    verifiedUserId = res.lastInsertRowid;
  } else {
    verifiedUserId = verifiedCheck.id;
    db.prepare('UPDATE users SET is_verified = 1 WHERE id = ?').run(verifiedUserId);
  }

  // 3. Unverified Normal User Account
  const unverifiedCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('unverified@caletracker.com');
  if (!unverifiedCheck) {
    const hash = bcrypt.hashSync('unverified123', salt);
    db.prepare(`
      INSERT INTO users (name, email, password, role, is_verified)
      VALUES (?, ?, ?, 'user', 0)
    `).run('Unverified User', 'unverified@caletracker.com', hash);
  } else {
    db.prepare('UPDATE users SET is_verified = 0 WHERE id = ?').run(unverifiedCheck.id);
  }

  // Check if deals table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM deals').get();
  if (countRow && countRow.count === 0) {
    const sampleDeals = [
      {
        title: 'Cyberpunk 2077: Phantom Liberty',
        discount: 50,
        platform: 'Steam',
        category: 'Gaming',
        ends: 'Nov 02, 2026',
        author: 'Verified Hunter',
        user_id: verifiedUserId,
        original_price: 59.99,
        sale_price: 29.99,
        deal_url: 'https://store.steampowered.com',
        description: 'Massive discount on the acclaimed RPG and spy-thriller expansion.',
        upvotes: 42
      },
      {
        title: 'PlayStation 5 DualSense Wireless Controller',
        discount: 30,
        platform: 'Amazon',
        category: 'Shopping',
        ends: 'Oct 28, 2026',
        author: 'Verified Hunter',
        user_id: verifiedUserId,
        original_price: 74.99,
        sale_price: 52.49,
        deal_url: 'https://amazon.com',
        description: 'Midnight Black edition wireless controller with haptic feedback.',
        upvotes: 35
      },
      {
        title: 'Elden Ring: Shadow of the Erdtree Edition',
        discount: 25,
        platform: 'PlayStation Store',
        category: 'Gaming',
        ends: 'Nov 05, 2026',
        author: 'CaleTracker Admin',
        user_id: adminId,
        original_price: 79.99,
        sale_price: 59.99,
        deal_url: 'https://store.playstation.com',
        description: 'Game of the Year base game plus the critically acclaimed expansion.',
        upvotes: 68
      },
      {
        title: 'Sony WH-1000XM5 Wireless Noise-Canceling',
        discount: 35,
        platform: 'Best Buy',
        category: 'Shopping',
        ends: 'Nov 10, 2026',
        author: 'CaleTracker Admin',
        user_id: adminId,
        original_price: 399.99,
        sale_price: 259.99,
        deal_url: 'https://bestbuy.com',
        description: 'Industry-leading noise cancellation headphones with auto NC optimizer.',
        upvotes: 29
      },
      {
        title: 'Nintendo Switch OLED - Mario Red Edition',
        discount: 15,
        platform: 'Target',
        category: 'Gaming',
        ends: 'Oct 31, 2026',
        author: 'Verified Hunter',
        user_id: verifiedUserId,
        original_price: 349.99,
        sale_price: 297.49,
        deal_url: 'https://target.com',
        description: 'Special edition vibrant 7-inch OLED screen console.',
        upvotes: 19
      },
      {
        title: 'Apple MacBook Air 15" M3 Chip',
        discount: 20,
        platform: 'B&H Photo',
        category: 'Shopping',
        ends: 'Nov 15, 2026',
        author: 'CaleTracker Admin',
        user_id: adminId,
        original_price: 1299.00,
        sale_price: 1039.20,
        deal_url: 'https://bhphotovideo.com',
        description: 'Liquid Retina display, 16GB unified memory, 512GB SSD storage.',
        upvotes: 51
      }
    ];

    const insertDeal = db.prepare(`
      INSERT INTO deals (title, discount, platform, category, ends, author, user_id, original_price, sale_price, deal_url, description, upvotes, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const deal of sampleDeals) {
      insertDeal.run(
        deal.title,
        deal.discount,
        deal.platform,
        deal.category,
        deal.ends,
        deal.author,
        deal.user_id,
        deal.original_price,
        deal.sale_price,
        deal.deal_url,
        deal.description,
        deal.upvotes
      );
    }

    console.log('[Database] Seeded initial deals and accounts');
  }
}

module.exports = {
  db,
  initDatabase,
  seedInitialData
};
