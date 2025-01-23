const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('../var/db/veltro.db');

// Clear all messages
db.run('DELETE FROM users', function(err) {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Deleted ${this.changes} rows`);
});

// Close the database connection
db.close();
