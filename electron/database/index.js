const path       = require('path');
const { app }    = require('electron');
const Database   = require('better-sqlite3');
const { migrate } = require('@blackglory/better-sqlite3-migrations');
const fs         = require('fs');

let db;

function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'flexevan.db');
  console.log('📂 [database] SQLite file will be at:', dbPath);
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  const migrationsDir = path.join(__dirname, 'migrations');
  const migrations = fs.readdirSync(migrationsDir)
    .filter(f => f.match(/^\d+.*\.js$/))
    .map(f => require(path.join(migrationsDir, f)));

  migrate(db, migrations);
  console.log('✅ Applied database migrations up to version', db.pragma('user_version', { simple: true }));
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

module.exports = { initDatabase, getDb };