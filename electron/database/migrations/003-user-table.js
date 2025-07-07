module.exports = {
  version: 3,
  up: (db) => {
    db.exec(`
      -- Create the users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL DEFAULT 'admin',
        password TEXT NOT NULL DEFAULT 'admin123',
        loggedin TEXT NOT NULL DEFAULT '0'
      );

      -- Insert default admin user if not exists
      INSERT INTO users (username, password, loggedin)
      SELECT 'admin', 'admin', '0'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');
    `);
  },

  down: (db) => {
    db.exec(`
      -- Drop the users table
      DROP TABLE IF EXISTS users;
    `);
  }
};