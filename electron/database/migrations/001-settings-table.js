module.exports = {
  version: 1,
  up: (db) => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        interface_name TEXT NOT NULL,
        host_ip TEXT NOT NULL,
        subnet_mask TEXT NOT NULL,
        pool_start TEXT NOT NULL,
        pool_end TEXT NOT NULL,
        logic_ad TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
  },
  down: (db) => {
    db.exec(`
        DROP TABLE IF EXISTS settings
    `);
  }
};