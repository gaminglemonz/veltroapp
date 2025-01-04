const sqlite3 = require('sqlite3');
const mkdirp = require('mkdirp');
const crypto = require('crypto');

const maindb = new sqlite3.Database('../var/db/veltro.db');

maindb.serialize(() => {
  maindb.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    hashed_password BLOB,
    salt BLOB,
    name TEXT,
    email TEXT UNIQUE,
    email_verified INTEGER,
    avatar BLOB
  )`);
  maindb.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    owner TEXT,
    description TEXT, 
    icon BLOB
  )`);
  maindb.run(`CREATE TABLE IF NOT EXISTS federated_credentials (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    subject TEXT NOT NULL,
    UNIQUE (provider, subject)
  )`);
});

module.exports = maindb;
