const sqlite3 = require('sqlite3');
const mkdirp = require('mkdirp');
const db = require('../db');

db.exec(`DROP TABLE room_members`, (err) => {
    if (err) {
         console.error('Error altering database:', err.message);
    } else {
        console.log('Database successfully altered');
    }
});