const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const db = require('./db'); // Import your database connection

module.exports = function(passport) {
    passport.use(new LocalStrategy(async (username, password, done) => {
        try {
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                    if (err) {
                        console.error("Database error during authentication:", err);
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            if (!user) {
                console.log('No user found with username:', username);
                return done(null, false, { message: 'Incorrect username.' });
            }

            console.log('User found:', user);

            // Compare password with hashed password
            const isMatch = await bcrypt.compare(password, user.hashed_password);
            console.log('Password from input:', password);
            console.log('Hashed password from DB:', user.hashed_password);

            if (!isMatch) {
                console.log('Incorrect password for user:', username);
                return done(null, false, { message: 'Incorrect password.' });
            }

            console.log('User authenticated successfully:', user);
            return done(null, user);
        } catch (err) {
            console.error("Error during authentication:", err);
            return done(err);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                    if (err) {
                        console.error("Database error during user deserialization:", err);
                        return reject(err);
                    }
                    resolve(row);
                });
            });
            done(null, user);
        } catch (err) {
            console.error("Error during user deserialization:", err);
            done(err);
        }
    });
};
