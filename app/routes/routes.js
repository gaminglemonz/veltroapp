const express = require("express");
const passport = require('passport');
const bcrypt = require('bcrypt');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const db = new sqlite3.Database('../var/db/veltro.db');
const router = express.Router();
const { promisify } = require('util');
const { arrayBuffer } = require("stream/consumers");

async function loadFileType() {
    const FileType = await import('file-type');
    return FileType;
}


// Promisify SQLite methods
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.runAsync = promisify(db.run.bind(db));

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
        const rows = await db.allAsync('SELECT * FROM rooms');
        rooms = rows.map(room => ({
            id: room.id,
            name: room.name,
            owner: room.owner,
            description: room.description,
            icon: room.icon,
            banner: room.banner,
            visiblity: room.visibility,
            type: room.type,
            messageCount: room.messageCount,
            memberCount: room.memberCount,
        }));
        // console.log('Processed Rooms:', rooms);
    } catch (error) {
        console.error('Error while retrieving room data:', error);
        rooms = [];
    }
};
extractRooms();

const addMemberToRoom = async (roomID, username, avatar) => {
    try {
        await db.runAsync('INSERT INTO room_members (room_id, username, avatar) VALUES (?, ?, ?)', [roomID, username, avatar]);
    } catch (err) {
        console.error('Error adding member to room:', err);
    }
};
const getRoomMembers = async (roomID) => {
    try {
        console.log('Getting room members for roomID:', roomID);
        const rows = await db.allAsync('SELECT * FROM room_members WHERE room_id = ?', [roomID]);
        console.log('Room Members:', rows);
        await db.run('UPDATE rooms SET memberCount = ? WHERE id = ?', [rows.length, roomID]);
        return rows.map(member => ({
            id: member.id,
            username: member.username,
            role: member.role,
            avatar: member.avatar
        }));
    } catch (err) {
        console.error('Error while getting room members:', err)
        return [];
    }
};
const getRoomMessages = async (roomID) => {
    try {
        // console.log('Messages from roomID', roomID)
        const rows = await db.allAsync('SELECT * FROM messages WHERE room_id = ?', [roomID]);
        // console.log('Database Rows:', rows);
        const loadedMessages = rows.map(row => ({
            username: row.username,
            content: row.content,
            avatar: row.avatar,
            timestamp: row.timestamp,
            room_id: row.room_id,
        }));
        // console.log('Loaded Messages:', loadedMessages);
        await db.run('UPDATE rooms SET messageCount = ? WHERE id = ?', [rows.length, roomID]);
        return loadedMessages;
    } catch (err) {
        console.error("Error getting messages:", err);
        return [];
    }
};

router.get('/header', (req, res) => {
    res.render('header', { user: req.user });
});
router.get('/profile', (req, res) => {
    res.render('profile', { user: req.user });
});
router.get('/rooms', (req, res) => {
    res.render('rooms', { user: req.user, rooms: rooms });
});
router.get('/create-room', (req, res, err) => {
    res.render('create-room', { user: req.user })
});
router.get('/room/:id/icon', async (req, res) => {
    try {

        const { id } = req.params;
        const row = await db.getAsync('SELECT icon FROM rooms WHERE id = ?', [id]);
        if (!row || !row.icon) {
            return res.status(404).send('Room icon not found');
        }

        const FileType = (await import('file-type')).fileTypeFromBuffer;
        const imageType = await FileType(row.icon);
        if (imageType) {
            res.set('Content-Type', imageType.mime);
            res.send(row.icon);
        } else {
            res.status(400).send('Unsupported Image Format');
        }
    } catch (err) {
        console.error('Error while retrieving room icon:', err.message);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/rooms/:roomId', async (req, res) => {
    const { roomId } = req.params;
    const avatar = '/avatar/' + req.user.id;

    try {
        const room = await db.getAsync('SELECT * FROM rooms WHERE id = ?', [roomId]);
        const messages = await getRoomMessages(roomId);
        const members = await getRoomMembers(roomId);

        await addMemberToRoom(roomId, req.user.username, avatar);

        if (!room) return res.status(404).send('Room not found');
        res.render('room', { user: req.user, room, messages, members });
    } catch (err) {
        console.error('Error retrieving room:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create-room', upload.fields([{ name: 'icon' }, { name: 'banner' }]), async (req, res, next) => {
    try {
        const { name, visibility, type, password } = req.body;
        const owner = req.user.username;

        console.log(req.files);

        let iconPath = null;
        let bannerPath = null;

        if (req.files?.icon) {
            iconPath = `../../public/uploads/${Date.now()}-icon-${req.files.icon[0].originalname}`;
            fs.writeFileSync(path.join(__dirname, 'public', iconPath), req.files.icon[0].buffer);
            console.log('Icon saved at:', iconPath);
        }

        if (req.files?.banner) {
            bannerPath = `../../public/uploads/${Date.now()}-banner-${req.files.banner[0].originalname}`;
            fs.writeFileSync(path.join(__dirname, 'public', bannerPath), req.files.banner[0].buffer);
            console.log('Banner saved at:', bannerPath);
        }

        const existingRoom = await db.getAsync('SELECT * FROM rooms WHERE name = ?', [name]);
        if (existingRoom) return res.status(400).send('Room already exists');

        if (visibility === '1' && password) {
            const hashedPassword = await bcrypt.hash(password, 10);
        }

        console.log('Inserting into DB:', { name, owner, iconPath, bannerPath, visibility, type });

        await db.runAsync('INSERT INTO rooms (name, owner, icon, banner, visibility, type) VALUES (?, ?, ?, ?, ?, ?)', [name, owner, iconPath, bannerPath, visibility, type]);

        extractRooms();
        res.redirect('/rooms');
    } catch (err) {
        console.error('Error while creating room:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/signup', (req, res) => {
    if (req.user) return res.redirect('/chat');
    res.render('signup');
});
router.post('/signup', async (req, res, next) => {
    try {
        const { username, password, email } = req.body;

        const existingUser = await db.getAsync('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).send(`Username "${username}" is already taken. Please choose another.`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const status = getUserRole(username);

        db.run(
            'INSERT INTO users (username, hashed_password, email, status) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, status],
            function (err) {
                if (err) {
                    console.error('Error during user insertion:', err);
                    return next(err);
                }

                const user = { id: this.lastID, username }; // Use `this.lastID` here
                req.login(user, (err) => {
                    if (err) return next(err);
                    res.redirect('/rooms');
                });
            }
        );
    } catch (err) {
        console.error('Error during signup:', err);
        next(err);
    }
});


router.get('/login', (req, res) => {
    if (req.user) return res.redirect('/dashboard');
    res.render('login');
});

router.post('/login/password', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect('/login');
        req.login(user, (err) => {
            if (err) return next(err);
            res.redirect('/rooms');
        });
    })(req, res, next);
});

router.post('/update-username', async (req, res) => {
    try {
        const { username } = req.body;
        const userID = req.user.id;

        await db.runAsync('UPDATE users SET username = ? WHERE id = ?', [username, userID]);
        res.redirect('/profile');
    } catch (err) {
        console.error('Error updating username:', err);
        res.status(500).send('Failed to update username.');
    }
});

router.post('/delete-user', async (req, res) => {
    try {
        const userID = req.user.id;
        await db.runAsync('DELETE FROM users WHERE id = ?', [userID]);
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Failed to delete user.');
    }
});

router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded or file type not supported.');

    const avatar = req.file.buffer;
    const userID = req.user.id;

    db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userID], (err) => {
        if (err) {
            console.error('Error saving avatar:', err);
            res.status(500).send('Failed to upload avatar.');
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
            return res.status(500).send('Failed to delete avatar.');
        }
        res.send('Avatar deleted successfully.');
    });
});


router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;
