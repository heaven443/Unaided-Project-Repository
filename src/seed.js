require('dotenv').config();
const { initDatabase, seedInitialData, db } = require('./config/database');

console.log('[Seed] Re-initializing and seeding database...');
initDatabase();

// Clear existing deals and users
db.exec('DELETE FROM deals;');
db.exec('DELETE FROM users;');
try {
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('deals', 'users');");
} catch (e) {
  // Ignore if sequence table does not exist
}

seedInitialData();
console.log('[Seed] Database successfully reset and seeded with fresh sample data!');
process.exit(0);
