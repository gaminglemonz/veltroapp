const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Define database path
const dbPath = path.resolve(__dirname, '../var/db/veltro.db');

// Check if the database directory exists; create it if not
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Database directory created:', dbDir);
} else {
  console.log('Database directory exists:', dbDir);
}

// Initialize the database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database:', dbPath);
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE,
      hashed_password BLOB,
      salt BLOB,
      name TEXT,
      email TEXT UNIQUE,
      email_verified INTEGER,
      status TEXT,
      avatar BLOB
    )`,
    (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Users table created or already exists.');
      }
    }
  );
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        avatar BLOB,
        content TEXT,
        username TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        room_id INTEGER,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
    );
  `, 
  (err) => {
    if (err) {
      console.error('Error creating messages table:', err.message);
    } else {
      console.log('Messages table created or already exists.');
    }
  });
  db.run(
    `CREATE TABLE IF NOT EXISTS room_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        room_id INTEGER,
        username TEXT,
        FOREIGN KEY (room_id) REFERENCES rooms(id)
    )`
  )
  db.run(
    `CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      owner TEXT,
      description TEXT, 
      icon BLOB,
      banner BLOB,
      visibility TEXT,
      type TEXT,
      memberCount INTEGER,
      messageCount INTEGER
    )`,
    (err) => {
      if (err) {
        console.error('Error creating rooms table:', err.message);
      } else {
        console.log('Rooms table created or already exists.');
      }
    }
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS federated_credentials (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      provider TEXT NOT NULL,
      subject TEXT NOT NULL,
      UNIQUE (provider, subject)
    )`,
    (err) => {
      if (err) {
        console.error('Error creating federated_credentials table:', err.message);
      } else {
        console.log('Federated credentials table created or already exists.');
      }
    }
  );

  // Insert example room
  const imageBuffer = fs.readFileSync('public/images/veltro.png')
  db.run(
    `INSERT INTO rooms (name, owner, description, icon, banner) VALUES (?, ?, ?, ?, ?)`,
    ['Example Room #1', 'NF', 'Example', imageBuffer],
    (err) => {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log('Room already exists. Skipping insertion.');
        } else {
          console.error('Error inserting example room:', err.message);
        }
      } else {
        console.log('Example room inserted successfully.');
      }
    }
  );
});

module.exports = db;
