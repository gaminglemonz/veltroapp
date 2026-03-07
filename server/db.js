
import sqlite3 from 'sqlite3';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

sqlite3.verbose();

const dbPath = path.resolve(__dirname, 'var/db/veltro.db');

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
      name TEXT,
      username TEXT UNIQUE,
      hashed_password BLOB,
      salt BLOB,
      email TEXT UNIQUE,
      email_verified INTEGER,
      avatar BLOB,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      messageCount INTEGER DEFAULT 0,
      friendCount INTEGER DEFAULT 0,
      roomCount INTEGER DEFAULT 0,
      notifications INTEGER DEFAULT 0
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
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      friend_id INTEGER,
      status TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id),
      UNIQUE (user_id, friend_id)
    )`, (err) => { 
      if (err) {
        console.error('Error creating friends table:', err.message);
      } else {
        console.log('Friends table created or already exists.');
      }
    })
  db.run(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      friend_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (friend_id) REFERENCES users(id)
    )
  `)
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
        status TEXT,
        avatar BLOB,
        FOREIGN KEY (room_id) REFERENCES rooms(id),
        UNIQUE (room_id, username, user_id)
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
      hashedPassword BLOB,
      memberCount INTEGER DEFAULT 0,
      messageCount INTEGER DEFAULT 0
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

  db.run(
    `CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      encrypted_id BLOB,
      username TEXT NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      encrypted_message TEXT NOT NULL,
      avatar BLOB,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error('Error creating private_messages table:', err.message);
      } else {
        console.log('Private messages table created or already exists.');
      }
    });

  db.run(`UPDATE rooms SET messageCount = (SELECT COUNT(*) FROM messages WHERE messages.room_id = rooms.id)`, (err) => {
    if (err) {
      console.error('Error updating message count:', err.message);
    } else {
      console.log('Message count updated successfully.');
    }
  });
  db.run(
    `CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      encrypted_id BLOB,
      username TEXT NOT NULL,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      encrypted_message TEXT NOT NULL,
      avatar BLOB,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id),
      FOREIGN KEY (encrypted_id) REFERENCES private_message_rooms(encrypted_id)
    )`, (err) => {
      if (err) {
        console.error('Error creating private_messages table:', err.message);
      } else {
        console.log('Private messages table created or already exists.');
      }
    });

  db.run(`UPDATE rooms SET messageCount = (SELECT COUNT(*) FROM messages WHERE messages.room_id = rooms.id)`, (err) => {
    if (err) {
      console.error('Error updating message count:', err.message);
    } else {
      console.log('Message count updated successfully.');
    }
  });
  db.run(
    `CREATE TABLE IF NOT EXISTS private_message_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      encrypted_id BLOB,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Error creating private_messages_rooms table:', err.message);
      } else {
        console.log('Private messaging rooms table created or already exists.');
      }
    });

  // Alter SQL Table Here
  // db.exec(`ALTER TABLE rooms ADD COLUMN hashedPassword`, (err) => {
  //   if (err) {
  //        console.error('Error altering database:', err.message);
  //   } else {
  //       console.log('Database successfully altered');
  //   }
  // }); 
});

export default db;