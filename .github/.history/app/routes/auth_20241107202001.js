const express = require("express");
const passport = require('passport');
const bcrypt = require('bcrypt');
const mutler = require('multer');
const db = require('../db');
const router = express.Router();

const storage = mutler.memoryStorage();
const upload = mutler({ storage: storage }).single('avatar');

const admins = [
    'ThatLemonGamer',
    'Dominic R.',
    'WKoA',
    '21262',
    'Sprout',
    'thelegendski',
];

router.get('/header', (req, res) => {
    res.render('header', { user: req.user })
})
router.get('/chat', (req, res) => {
    res.render('chat', { user: req.user })
});
router.get('/profile', (req, res) => {
    res.render('profile', { user: req.user })
});
router.get('/signup', (req, res) => {
    res.render('signup');
});

router.post('/signup', async (req, res, next) => {
    try {
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [req.body.username], (err, row) => {
                if (err) {
                    console.error("Database error during signup user check:", err);
                    return reject(err);
                }
                resolve(row);
            });
        });

        if (existingUser) {
            return res.status(400).send('Username ' + existingUser.username + ' already taken. Please choose another one.');
        }

        // Hashing the password using bcrypt
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        console.log('Hashed Password on signup:', hashedPassword); // Log the hashed password

        
        let isAdmin, status;
        admins.forEach((i) => {
            if (req.body.user === admins[i]){
                isAdmin = true;
            }
        });
        if (isAdmin){
            status = "Admin";
        } else {
            status = "User";
        }
        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (username, hashed_password, email, status) VALUES (?, ?, ?, ?)', [
                req.body.username,
                hashedPassword,
                req.body.email,
                status,
            ], function (err) {
                if (err) {
                    console.error("Error inserting user:", err);
                    return reject(err);
                }
                resolve(this);
            });
        });

        console.log('Inserted user with user ID:', result.lastID);
        const user = { id: result.lastID, username: req.body.username };
        req.login(user, err => {
            if (err) return next(err);
            res.redirect('/chat');
        });
    } catch (err) {
        console.error('Error while registering user:', err);
        return next(err);
    }
});

router.get('/login', (req, res) => {
    res.render('login'); // Render login page
});

router.post('/login/password', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error("Error while logging in:", err);
            return next(err);
        }
        if (!user) {
            console.error('Failed to authenticate', info.message);
            return res.redirect('/login');
        }
        req.login(user, err => {
            if (err) return next(err);
            res.redirect('/chat');
        });
    })(req, res, next);
});

router.post('/upload-avatar', (req, res, next) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    const avatar = req.file.buffer;

    db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.user.id], (err) => {
        if (err) {
            console.error('Error uploading avatar:', err);
            return res.status(500).send('Error saving avatar: ' + err);
        }

        res.send('Avatar for user ID ' + req.user.id + ' uploaded successfully.');
    })
});

router.get('/avatar/:id', (req, res) => {
    db.get('SELECT avatar FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            console.error('Error retrieving avatar', err);
            return res.status(500).send('Error retrieving avatar: ' + err);
        }

        if (row && row.avatar) {
            res.contentType('image/png');
            res.send(row.avatar);
        } else {
            res.send('Avatar not found');
        }
    })
});

router.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/'); // Redirect to homepage after logout
    });
});

module.exports = router;
