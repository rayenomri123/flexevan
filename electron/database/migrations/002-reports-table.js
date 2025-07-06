module.exports = {
  version: 2,
  up: (db) => {
    db.exec(`
      -- 1) Create the main reports table with updated fields
      CREATE TABLE IF NOT EXISTS reports (
        id                            INTEGER PRIMARY KEY AUTOINCREMENT,
        title                         TEXT    NOT NULL,
        vehicle_identification_number TEXT    NOT NULL,
        ecu_serial_number_data_identifier             TEXT    NOT NULL,
        system_supplier_identifier    TEXT    NOT NULL,
        vehicle_manufacturer_ecu_hardware_number TEXT NOT NULL,
        manufacturer_spare_part_number TEXT   NOT NULL,
        created_at                    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- 2) Create the FTS5 index on title
      CREATE VIRTUAL TABLE IF NOT EXISTS reports_fts
      USING fts5(
        title,
        content='reports',
        content_rowid='id'
      );

      -- 3) Triggers to keep the FTS index in sync
      CREATE TRIGGER IF NOT EXISTS reports_ai
      AFTER INSERT ON reports
      BEGIN
        INSERT INTO reports_fts(rowid, title) VALUES (new.id, new.title);
      END;

      CREATE TRIGGER IF NOT EXISTS reports_au
      AFTER UPDATE ON reports
      BEGIN
        INSERT INTO reports_fts(reports_fts, rowid, title)
          VALUES('delete', old.id, old.title);
        INSERT INTO reports_fts(rowid, title)
          VALUES (new.id, new.title);
      END;

      CREATE TRIGGER IF NOT EXISTS reports_ad
      AFTER DELETE ON reports
      BEGIN
        INSERT INTO reports_fts(reports_fts, rowid, title)
          VALUES('delete', old.id, old.title);
      END;
    `);
  },

  down: (db) => {
    db.exec(`
      -- Drop all triggers, the FTS table, and the main reports table
      DROP TRIGGER IF EXISTS reports_ai;
      DROP TRIGGER IF EXISTS reports_au;
      DROP TRIGGER IF EXISTS reports_ad;

      DROP VIRTUAL TABLE IF EXISTS reports_fts;
      DROP TABLE IF EXISTS reports;
    `);
  }
};