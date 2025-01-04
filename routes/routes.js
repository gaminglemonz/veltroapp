const express = require("express");
const passport = require('passport');
const bcrypt = require('bcrypt');
const multer = require('multer');
const db = require('../../app/');
const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const admins = ['ThatLemonGamer', 'Lemon Games'];
const moderators = [
    'ThatLemonGamer', 'Lemon Games', 'thelegendski', 
    'Sprout', 'Dominic R.', 'S.M.V', 'Astro'
];

const getUserRole = (username) => {
    if (admins.includes(username)) return 'Admin';
    if (moderators.includes(username)) return 'Moderator';
    return 'User';
};

let rooms = [];
const extractRooms = async () => {
    try {
        const rooms = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM rooms', [], (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });

        console.log('Rooms:', rooms);
        return rooms.map((room) => ({
            name: room.name,
            owner: room.owner,
            description: room.description,
            icon: room.icon,
        }));
    } catch (error) {
        console.error('Error while retrieving room data:', error);
        return [];
    }
};

// Example usage
(async () => {
    const rooms = await extractRooms();
    console.log('Processed Rooms:', rooms);
})();



// Routes
router.get('/header', (req, res) => {
    res.render('header', { user: req.user });
});

router.get('/chat', (req, res) => {
    res.render('chat', { user: req.user });
});

router.get('/profile', (req, res) => {
    res.render('profile', { user: req.user });
});
router.get('/rooms', (req, res) => {
    res.render('profile', { user: req.user, rooms: rooms });
});
router.get(':/room', (req, res) => {

});

router.get('/signup', (req, res) => {
    if (req.user) {
        return res.redirect('/chat');
    }
    res.render('signup');
});

router.post('/signup', async (req, res, next) => {
    try {
        const { username, password, email } = req.body;

        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });

        if (existingUser) {
            return res.status(400).send(`Username "${username}" is already taken. Please choose another.`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const status = getUserRole(username);

        const result = await new Promise((resolve, reject) => {
            db.run('INSERT INTO users (username, hashed_password, email, status) VALUES (?, ?, ?, ?)', 
                [username, hashedPassword, email, status], 
                function (err) {
                    if (err) return reject(err);
                    resolve(this);
                }
            );
        });

        const user = { id: result.lastID, username };
        req.login(user, (err) => {
            if (err) return next(err);
            res.redirect('/chat');
        });
    } catch (err) {
        console.error('Error during signup:', err);
        next(err);
    }
});

router.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/chat');
    }
    res.render('login');
});

router.post('/login/password', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect('/login');
        
        req.login(user, (err) => {
            if (err) return next(err);
            res.redirect('/chat');
        });
    })(req, res, next);
});

router.post('/update-username', async (req, res) => {
    const { username } = req.body;
    const userID = req.user.id;

    try {
        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET username = ? WHERE id = ?', [username, userID], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating username:', err);
        res.status(500).send('Failed to update username.');
    }
});
router.post('/delete-user', async (req, res) => {
    const { username } = req.body;
    const userID = req.user.id;

    try {
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM users WHERE id = ?', [userID], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Failed to delete user.');
    }
});

router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded or file type not supported.');
    }

    const avatar = req.file.buffer;
    const userID = req.user.id;

    db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userID], (err) => {
        if (err) {
            console.error('Error saving avatar:', err);
            res.render('profile', { error: err })
        }
        res.redirect('/profile');
    });
});

router.get('/avatar/:id', (req, res) => {
    db.get('SELECT avatar FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            console.error('Error retrieving avatar:', err);
            return res.status(500).send('Error retrieving avatar.');
        }

        if (row && row.avatar) {
            res.contentType('image/png');
            res.send(row.avatar);
        } else {
            res.status(404).send('Avatar not found.');
        }
    });
});

router.post('/delete-avatar', (req, res) => {
    const userID = req.user.id;

    db.run('UPDATE users SET avatar = NULL WHERE id = ?', [userID], (err) => {
        if (err) {
            console.error('Error deleting avatar:', err);
            return res.status(500).send('Error deleting avatar.');
        }
        res.send('Avatar deleted successfully.');
    });
});

// Logout Route
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;
