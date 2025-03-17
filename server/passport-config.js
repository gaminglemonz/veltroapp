import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = new URL('./db.js', import.meta.url).href;
const { default: db } = await import(dbUrl);

function checkDatabaseDirectory(target) {
    const directoryPath = path.dirname(target);

    if (fs.existsSync(directoryPath)) {
        console.log('Database directory exists for passport-config.js', directoryPath);
        if (fs.existsSync(target)) {
            console.log('Database file exists for passport-config.js:', target);
        } else {
            console.log(target, "is not an existing file");
        }
    } else {
        console.log(directoryPath, "is not an existing directory");
    }
}
checkDatabaseDirectory(path.join(__dirname, 'db.js'));

function passportConfig(passport) {
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

export default passportConfig;