import express, { Request, Response } from "express";
const passport = require('passport');
const GoogleStrategy = require('passport-google-oidc');
const bcrypt = require('bcrypt');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const db = new sqlite3.Database('../var/db/veltro.db');
const router = express.Router();
const { promisify } = require('util');
const { arrayBuffer } = require("stream/consumers");
const { Request, Response } = require('express');

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
    fileFilter: (req: {}, file: { mimetype: string }, cb: any) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

const admins: string[] = ['ThatLemonGamer', 'Lemon Games'];
const moderators: string[] = [
    'ThatLemonGamer', 'Lemon Games', 'thelegendski', 
    'Sprout', 'Dominic R.', 'S.M.V', 'Astro'
];

const getUserRole = (username: string) => {
    if (admins.includes(username)) return 'Admin';
    if (moderators.includes(username)) return 'Moderator';
    return 'User';
};

let rooms: { id: number, name: string, owner: string, description: string, icon: any, banner: any  }[] = [];
const extractRooms = async () => {
    try {
        const rows = await db.allAsync('SELECT * FROM rooms');
        if (rows) {
            rooms = rows.map((room: { id: number, name: string, owner: string, description: string, icon: any, banner: any, visibility: string, type: string, messageCount: number, memberCount: number }) => ({
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
        }
        // console.log('Processed Rooms:', rooms);
    } catch (error) {
        console.error('Error while retrieving room data:', error);
        rooms = [];
    }
};
extractRooms();

const addMemberToRoom = async (roomID: number, username: string, avatar: any) => {
    try {
        await db.runAsync('INSERT INTO room_members (room_id, username, avatar) VALUES (?, ?, ?)', [roomID, username, avatar]);
    } catch (err) {
        console.error('Error adding member to room:', err);
    }
};
const getRoomMembers = async (roomID: number) => {
    try {
        console.log('Getting room members for roomID:', roomID);
        const rows = await db.allAsync('SELECT * FROM room_members WHERE room_id = ?', [roomID]);
        console.log('Room Members:', rows);
        await db.run('UPDATE rooms SET memberCount = ? WHERE id = ?', [rows.length, roomID]);
        return rows.map((member: { id: number, username: string, role: string, avatar: any }) => ({
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
const getRoomMessages = async (roomID: number) => {
    try {
        // console.log('Messages from roomID', roomID)
        const rows = await db.allAsync('SELECT * FROM messages WHERE room_id = ?', [roomID]);
        // console.log('Database Rows:', rows);
        const loadedMessages = rows.map((row: { username: string, content: string, avatar: any, timestamp: any, room_id: number}) => ({
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
const getFriends = async(userID: number) => {
    try {
        console.log('Getting friends for userID:', userID);
        const rows = await db.allAsync('SELECT * FROM friends WHERE user_id = ?', [userID]);
        console.log('Friends:', rows);
        const loadedFriends = rows.map((row: { user_id: number, friend_id: number }) => ({
            user_id: row.user_id,
            friend_id: row.friend_id,
        }))
        const loadedUsers = loadedFriends.map((friend: { friend_id: number }): number => {
            return db.getAsync('SELECT * FROM users WHERE id = ?', [friend.friend_id]);
        });
        return Promise.all(loadedUsers);
    } catch (err) {
        console.error('Error while getting friends:', err);
        return [];
    }
}
const getFriendRequests = async(userID: number) => {
    try {
        console.log('Getting friend requests for userID:', userID);
        const rows = await db.allAsync('SELECT * FROM friend_requests WHERE friend_id = ?', [userID]);
        console.log('Friend Requests:', rows);
        const loadedRequests = rows.map((row: { friend_id: number }) => ({
            friend_id: row.friend_id,
        }));
        const loadedUsers = loadedRequests.map((request: { friend_id: number })  => {
            return db.getAsync('SELECT * FROM users WHERE id = ?', [request.friend_id]);
        });
        return Promise.all(loadedUsers);
    } catch (err) {
        console.error('Error while getting friend requests:', err);
        return [];
    }
}

// Define User interface
interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    avatar?: any;
    bio?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

router.get('/profile/@:username', async (req: any, res: Response) => {
    const username = req.params.username;
    const { id } = req.user; 
    const user = await db.getAsync('SELECT * FROM users WHERE username = ?', [username]);

    const friends = await getFriends(user.id);
    try {
        if (!user) {
            return res.status(404).send('User not found');
        }

        if (user.id === id) res.redirect('/dashboard'); 
        else {
            res.render('user-profile', { user: req.user, profile: user });
        }
    } catch (err: any){
        console.error('Error getting', username, '\' profile information:', err.message);
        res.render('profile', { user: req.user, profile: user, friends, error: err.message });
    }
});
router.get('/profile/:username', (req, res) => {
    res.redirect(`/profile/@${req.params.username}`);
})
router.get('/header', (req, res) => {
    res.render('header', { user: req.user });
});
router.get('/dashboard', async (req: any, res: Response) => {
    const friendRequests = await getFriendRequests(req.user.id);
    const friends = await getFriends(req.user.id);
    res.render('dashboard', { user: req.user, friendRequests, friends });
});
router.get('/edit-profile', async (req, res) => {
    res.render('edit-profile', { user: req.user });
});
router.get('/rooms', (req: any, res: Response) => {
    res.render('rooms', { user: req.user, rooms: rooms });
});

router.get('/create-room', (req: Request, res: Response) => {
    res.render('create-room', { user: req.user })
});
router.get('/room/:id/icon', async (req: any, res: any) => {
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
    } catch (err: any) {
        console.error('Error while retrieving room icon:', err.message);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/rooms/:roomId', async (req: any, res: any) => {
    const { roomId } = req.params;
    const avatar = '/avatar/' + req.user.id;

    try {
        const room = await db.getAsync('SELECT * FROM rooms WHERE id = ?', [roomId]);
        const messages = await getRoomMessages(roomId);
        const members = await getRoomMembers(roomId);

        await addMemberToRoom(roomId, req.user.username, avatar);

        if (!room) return res.status(404).send('Room not found');
        res.render('room', { user: req.user, room, messages, members });
    } catch (err: any) {
        console.error('Error retrieving room:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create-room', upload.fields([{ name: 'icon' }, { name: 'banner' }]), async (req: any, res: Response, next) => {
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
    } catch (err: any) {
        console.error('Error while creating room:', err.message);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/friend-request/:id', async (req: any, res: Response) => { 
    try {
        const friendID = req.params.id;
        const userID = req.user.id;
        const current_requests = await db.allAsync('SELECT * FROM friend_requests WHERE user_id = ? AND friend_id = ?', [userID, friendID]);
        if (current_requests.length > 0) {
            return res.status(400).send('Friend request already sent.');
        }
        await db.runAsync('INSERT INTO friend_requests (user_id, friend_id) VALUES (?, ?)', [userID, friendID]);
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error sending friend request:', err);
        res.status(500).send('Failed to send friend request.');
    }
});
router.get('/accept-request/:id', async (req: any, res: Response) => { 
    try { 
        const friendID = req.params.id;
        const userID = req.user.id;
        await db.runAsync('DELETE FROM friend_requests WHERE user_id = ? AND friend_id = ?', [friendID, userID]);
        await db.runAsync('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [userID, friendID]);
        await db.runAsync('UPDATE users SET friendCount = friendCount + 1 WHERE id = ?', [userID]);
        await db.runAsync('UPDATE users SET friendCount = friendCount + 1 WHERE id = ?', [friendID]);

        res.redirect('/dashboard');
    } catch (err: any) {
        console.error('Error accepting friend request:', err);
        res.status(500).send('Failed to accept friend request.');
    }
});
router.get('/deny-request/:id', async (req: any, res: Response) => { 
    try { 
        const friendID = req.params.id;
        const userID = req.user.id;
        await db.runAsync('DELETE FROM friend_requests WHERE user_id = ? AND friend_id = ?', [friendID, userID]);

        res.redirect('/dashboard');
    } catch (err: any) {
        console.error('Error accepting friend request:', err);
        res.status(500).send('Failed to accept friend request.');
    }
});

router.get('/signup', (req, res) => {
    if (req.user) return res.redirect('/dashboard');
    res.render('signup');
});
router.post('/signup', async (req: any, res: Response, next) => {
    try {
        const { username, password, email, name } = req.body;

        const existingUser = await db.getAsync('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser) {
            return res.status(400).send(`Username "${username}" is already taken. Please choose another.`);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (username, name, hashed_password, email) VALUES (?, ?, ?, ?)',
            [username, name, hashedPassword, email],
            function (this: { lastID: number }, err: any) {
                if (err) {
                    console.error('Error during user insertion:', err);
                    return next(err);
                }

                const user: { id: number, username: string } = { id: this.lastID, username };
                req.login(user, (err: any) => {
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

router.post('/login/password', (req: any, res: Response, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) return next(err);
        if (!user) return res.redirect('/login');
        req.login(user, (err: any) => {
            if (err) return next(err);
            res.redirect('/rooms');
        });
    })(req, res, next);
});

router.post('/update-profile', upload.single('avatar'), async (req: any, res: Response) => {
    try {
        const { name, username, bio } = req.body;
        const row = await db.getAsync('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
        let avatar = row ? row.avatar : null;
        if (req.file) {
            avatar = req.file.buffer;
        }
        await db.runAsync('UPDATE users SET name = ?, username = ?, bio = ?, avatar = ? WHERE id = ?', [name, username, bio, avatar, req.user.id]);
    
        avatar = req.file ? req.file.buffer : (row && row.avatar) ? row.avatar : null;
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('Error updating profile');
    }
});

router.post('/delete-user', async (req: any, res: Response) => {
    try {
        const userID = req.user.id;
        await db.runAsync('DELETE FROM users WHERE id = ?', [userID]);
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Failed to delete user.');
    }
});
router.post('/delete-message/:messageID', async (req, res) => { 
    try {
        const messageID = req.params.messageID;
        await db.runAsync('DELETE FROM messages WHERE id = ?', [messageID]);
    } catch (err) {
        console.error('Error deleting message:', err);
        res.status(500).send('Failed to delete message.');
    }
});
router.post('/edit-message/:messageID', async (req, res) => { 
    try {
        const messageID = req.params.messageID;
        const newMessage = req.body.newMessage;
        await db.runAsync('UPDATE messages SET content = ? WHERE id = ?', [newMessage, messageID]);
    } catch (err) {
        console.error('Error editing message:', err);
        res.status(500).send('Failed to edit message.');
    }
});

router.post('/upload-avatar', upload.single('avatar'), (req: any, res: Response) => {
    if (!req.file) return res.status(400).send('No file uploaded or file type not supported.');

    const avatar = req.file.buffer;
    const userID = req.user.id;

    db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, userID], (err: string) => {
        if (err) {
            console.error('Error saving avatar:', err);
            res.status(500).send('Failed to upload avatar.');
        }
    });
    res.redirect('/dashboard');
});

router.get('/avatar/:id', (req, res) => {
    db.get('SELECT avatar FROM users WHERE id = ?', [req.params.id], (err: string, row: { avatar?: string }) => {
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

router.post('/delete-avatar', (req: any, res: Response) => {
    const userID = req.user.id;

    db.run('UPDATE users SET avatar = NULL WHERE id = ?', [userID], (err: any) => {
        if (err) {
            console.error('Error deleting avatar:', err);
            return res.status(500).send('Failed to delete avatar.');
        }
        res.send('Avatar deleted successfully.');
    });
});


router.post('/logout', (req: any, res: Response, next) => {
    req.logout((err: any) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;
