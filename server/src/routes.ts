import express, { Request, Response, ErrorRequestHandler } from "express";
import passport from 'passport';
import bcrypt from 'bcrypt';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { promisify } from "util";
import { arrayBuffer } from "stream/consumers";
import db from '../db.js';
import { error } from "console";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '../');

async function loadFileType() {
    const FileType = await import('file-type');
    return FileType;
}

db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.runAsync = promisify(db.run.bind(db));

const storage = multer.memoryStorage();
const upload = multer({ storage });

const hexGenerator = (length: number) => {
    const chars: string = '0123456789abcdef';
    let code: string = '';
    for (let i = 0; i < length; i ++){
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
};

let rooms: { id: number, name: string, owner: string, description: string, icon: any, banner: any  }[] = [];
const extractRooms = async () => {
    try {
        const rows = await db.allAsync('SELECT * FROM rooms');
        if (rows) {
            rooms = rows.map(
                (room: { id: number, name: string, owner: string, description: string, icon: any, banner: any, 
                visibility: string, type: string, messageCount: number, memberCount: number }) => ({
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
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error while getting room members:', err.message)
        return [];
    }
}
const getUserRooms = async (username: string) => {
    try {
        // console.log("Getting rooms for", username);
        const roomID = await db.getAsync('SELECT room_id FROM room_members WHERE username = ?', [username]);
        const rooms = await db.allAsync('SELECT * FROM rooms WHERE id = ?', [roomID]);
        // console.log("Rooms:", rooms);
        return rooms.map((room: { id: number, name: string, owner: string, description: string, icon: any, banner: any}) => ({
            id: room.id,
            name: room.name,
            description: room.description,
            owner: room.owner,
            icon: room.icon,
            banner: room.banner,
        }));
    } catch (err: ErrorRequestHandler | any) {
        console.error("Error while getting user rooms:", err.message);
        return [];
    }
}
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
}
const getFriendRequests = async(userID: number) => {
    try {
        const rows = await db.allAsync('SELECT * FROM friend_requests WHERE friend_id = ?', [userID]);
        const requestPromises = rows.map((row: { sender_id: number }) =>
            db.getAsync('SELECT id, username, name, avatar FROM users WHERE id = ?', [row.sender_id])
        );
        const requests = await Promise.all(requestPromises);
        return requests.filter((request: any) => request !== null);
    } catch (err) {
        console.error('Error while getting friend requests:', err);
        return [];
    }
}
const getFriends = async(userID: number) => {
    try {
        const rows = await db.allAsync(
            'SELECT * FROM friends WHERE user_id = ? OR friend_id = ?', 
            [userID, userID]
        );
        const friendPromises = rows.map((row: { user_id: number, friend_id: number }) => {
            const friendID = row.user_id === userID ? row.friend_id : row.user_id;
            return db.getAsync('SELECT id, username, name, avatar FROM users WHERE id = ?', [friendID]);
        });
        const friends = await Promise.all(friendPromises);
        return friends.filter((friend: any) => friend !== null);
    } catch (err) {
        console.error('Error while getting friends:', err);
        return [];
    }
}


// Authentication Routes
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

                    res.json({ success: true, user })
                });
            }
        );
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error during signup:', err.message);
        res.status(500).json({ success: false, error: `Error while signing in (internal): ${err.message}`})
    }
});
router.post('/login/password', (req: any, res: Response, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
        if (!user) {
            console.error("Invalid credentials");
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        req.login(user, async (err: any) => {
            if (err) {
                console.error("Session error", err);
                return res.status(500).json({ success: false, error: 'Session error' });
            }
            console.log("Logging in user ", user.id)
            const userData = await db.getAsync('SELECT * FROM users WHERE id = ?', [user.id]);

            res.json({ success: true, data: userData });
        });
    })(req, res, next);
});
router.get('/auth/user', async (req: Request | any, res: Response) => {
    console.log("Received request at /user");
    try {
        const userData = await db.getAsync(
            'SELECT id, username, email, name, avatar, bio, created_at, messageCount FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!userData) {
            console.log("User not found");
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const friends = await getFriends(req.user.id);
        const friendRequests = await getFriendRequests(req.user.id);
        const rooms = await getUserRooms(req.user.username);

        const data = {
            user: userData,
            friends: friends || [],
            friendRequests: friendRequests || [],
            friendCount: friends.length || 0,
            rooms: rooms || [],
        };

        // console.log("User data received, ", userData);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: 'Internal server error', success: false, });
    }
});
router.post('/update-profile/:id', upload.single('avatar'), async (req: any, res: Response) => {
    const updates: any = {};
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).send('Unauthorized');
        }

        const row = await db.getAsync('SELECT avatar FROM users WHERE id = ?', [req.user.id]);
        let avatar = row ? row.avatar : null;
        if (req.body.name) updates.name = req.body.name;
        if (req.body.username) updates.username = req.body.username;
        if (req.body.bio) updates.bio = req.body.bio;
        if (req.file) updates.avatar = req.file.buffer;
        avatar = req.file ? req.file.buffer : (row && row.avatar) ? row.avatar : null;
        console.log(req.file);
        console.log(avatar);

        if (req.file) {
            await db.runAsync('UPDATE users SET name = ?, username = ?, bio = ?, avatar = ? WHERE id = ?', 
                            [updates.name, updates.username, updates.bio, updates.avatar, req.user.id]);
        } else {
            await db.runAsync('UPDATE users SET name = ?, username = ?, bio = ? WHERE id = ?', 
                            [updates.name, updates.username, updates.bio, req.user.id]);
        }

        const data = await db.getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
        res.json({ success: true, data: data.updates })
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error updating profile:', err.message);
        console.log("reqbody:", req.body, '\nupdates:', updates);
        res.status(500).json({ success: false, error: `Error while updating profile: ${err.message}` });
    }
});
router.post('/room-login/:id', async (req: Request | any, res: Response) => {
    try {
        const password = req.body.password;
        let hashedPassword = (await db.getAsync('SELECT hashed_password FROM rooms WHERE id = ?', [req.body.id]))
                             ?.hashed_password;

        bcrypt.compare(password, hashedPassword, (err: any, result: boolean) => {
            if (err) {
                console.error("Error while trying to compare passwords:", err);
                res.status(401).json({ success: false, error: 'Error while trying to compare passwords' });
                return;
            }
            if (result) {
                res.redirect(`/rooms/${req.params.id}`);
            }
        });
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error while logging into room:', err.message);
        res.status(500).json({ success: false, error: `Error while logging into room: ${err.message}` });
    }
});
router.post('/delete-user', async (req: Request | any, res: Response) => {
    try {
        const userID = req.user.id;
        await db.runAsync('DELETE FROM users WHERE id = ?', [userID]);
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Failed to delete user.');
    }
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

// Message Routes
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
router.get('/avatar/:id', async (req: Request, res: Response) => {
    try {
        const userData = await db.getAsync('SELECT avatar FROM users WHERE id = ?', [req.params.id]);
        
        if (!userData || !userData.avatar) {
            return res.sendFile(path.join(__dirname, '../public/default-avatar.png'));
        }

        const FileType = (await import('file-type')).fileTypeFromBuffer;
        const type = await FileType(userData.avatar);
        
        if (type && type.mime.startsWith('image/')) {
            res.contentType(type.mime);
            res.send(userData.avatar);
        } else {
            res.status(400).send('Invalid image format');
        }
    } catch (err) {
        console.error('Error retrieving avatar:', err);
        res.status(500).send('Error retrieving avatar');
    }
});


// Friend Request Routes
router.post('/friend-request/:id', async (req: any, res: Response) => { 
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
router.post('/remove-friend/:id', async (req: any, res: Response) => {
    try {
        db.run('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [req.user.id, req.params.id]);
        console.log("Removed friend", req.params.id, "from user", req.user.id);
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error removing friend:', err.message);
    }
});

// API Routes
router.get('/api/roomlist', async (req: Request | any, res: Response) => {
    try {
        const rooms = await db.allAsync('SELECT * FROM rooms');
        if (!rooms || rooms.length === 0) return res.status(404).json({ success: false, error: 'No rooms found' });

        res.json({ success: true, rooms })
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error while getting rooms:', err);
        res.status(500).json({ success: false, error: err.message || "Error fetching room list" });
    }
});
router.get('/api/roomlist/:username', async (req: Request | any, res: Response) => {
    try {
        const rooms = await getUserRooms(req.params.username);
        if (!rooms || rooms.length === 0) return res.status(404).json({ success: false, error: 'No rooms found' });

        res.json({ success: true, rooms });
    }
    catch (err: ErrorRequestHandler | any) {
        console.error('Error while getting rooms for user:', err.message);
        res.status(500).json({ success: false, error: err.message || "Error fetching user rooms"});
    }
});
router.get('/api/rooms/messages/:id', async (req: Request | any, res: Response) => {
    try {
        const messages = await db.getAsync('SELECT * FROM messages WHERE room_id = ?', [req.params.id]);
        res.json({ success: true, messages });
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error while getting room messages:', err);
        res.status(500).json({ success: false, error: err.message || "Error fetching room messages" });
    }
});
router.get('/api/profile/:id', async (req: Request | any, res: Response) => {
    console.log("Received request at /profile/", req.params.id);
    try {
        const userData = await db.getAsync(
            'SELECT id, username, email, name, avatar, bio, created_at, messageCount FROM users WHERE id = ?',
            [req.params.id]
        );

        if (!userData) {
            console.log("User not found");
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const friends = await getFriends(req.params.id);
        const friendRequests = await getFriendRequests(req.params.id);
        const rooms = await getUserRooms(req.params.username);

        const data = {
            user: userData,
            friends: friends || [],
            friendRequests: friendRequests || [],
            friendCount: friends.length || 0,
            rooms: rooms || [],
        };

        console.log("User data received, ", userData);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: 'Internal server error', success: false, });
    }
});
router.get('/api/user/:username', async (req: Request | any, res: Response) => {
    console.log("Received request at /profile/", req.params.username);
    try {
        const userData = await db.getAsync(
            'SELECT id, username, email, name, avatar, bio, created_at, messageCount FROM users WHERE username = ?',
            [req.params.username]
        );

        if (!userData) {
            console.log("User not found");
            return res.status(404).json({ success: false, errorCode: 404, error: 'User not found' });
        }

        const friends = await getFriends(userData.id);
        const friendRequests = await getFriendRequests(userData.id);
        const rooms = await getUserRooms(req.params.username);

        const data = {
            user: userData,
            friends: friends || [],
            friendRequests: friendRequests || [],
            friendCount: friends.length || 0,
            rooms: rooms || [],
        };

        console.log("User data received, ", userData);
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: 'Internal server error', success: false, });
    }
});

router.post('/api/join-room/:id', async (req: Request | any, res: Response) => {
    try {
        const roomID = await db.getAsync('SELECT room_id FROM room_members WHERE username = ?', 
                                         [ req.user.username ]);
        console.log("Room ID:", roomID);
        if (roomID) {
            console.log("User already in room");
        } else {
            await db.runAsync('INSERT INTO room_members (room_id, username, avatar) VALUES (?, ?, ?)', 
                              [ req.params.id, req.user.username, req.user.avatar ]);
        }
        res.status(200).json({ success: true });
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error while joining room:', err.message);
        res.status(500).json({ success: false, error: `Error while joining room: ${err.message}` });
    }
});
router.get('/room/:id/icon', async (req: Request, res: Response) => {
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
router.get('/api/rooms/:id', async (req: Request | any, res: Response) => {
    const { id } = req.params;

    try {
        if (!req.user) res.redirect('/login');
        let avatar;
        if (req.isAuthenticated) {
            avatar = '/avatar/' + req.user?.id;

            const room = await db.getAsync('SELECT * FROM rooms WHERE id = ?', [id]);
            const messages = await getRoomMessages(id);
            const members = await getRoomMembers(id);

            if (!room) return res.status(404).send('Room not found');

            res.json({ success: true, room, messages, members });
        } else {
            res.redirect('/login');
        }
    } catch (err: any) {
        console.error('Error retrieving room:', err.message);
        res.status(500).json({ success: false, error: err.message});
    }
});
router.post('/api/create-room', upload.fields([{ name: 'icon' }, { name: 'banner' }]), async (req: Request | any, res: Response) => {
    
    // console.log("Received req.body:", req.body);
    // console.log("Received req.files:", req.files);
    try {
        const { name, description, type, visibility, password } = req.body;
        if (!password) {
            let password = null;
        }
        const owner = req.user.username;
        let hashedPassword = null;
        console.log("User attempting to create room:", owner);               

        let iconPath = null;
        let bannerPath = null;

        if (req.files?.icon) {
            iconPath = `/uploads/${Date.now()}-icon-${req.files.icon[0].originalname}`;
            fs.writeFileSync(path.join(__dirname, '../../client/public', iconPath), req.files.icon[0].buffer);
        }

        if (req.files?.banner) {
            bannerPath = `/uploads/${Date.now()}-banner-${req.files.banner[0].originalname}`;
            fs.writeFileSync(path.join(__dirname, '../../client/public', bannerPath), req.files.banner[0].buffer);
        }

        if (visibility === 'private' && password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const existingRoom = await db.getAsync('SELECT * FROM rooms WHERE name = ?', [name]);
        if (existingRoom) {
            console.error("Room already exists");
            return res.status(400).json({ success: false, error: 'Room already exists' });
        }

        await db.runAsync(
            'INSERT INTO rooms (name, owner, description, icon, banner, visibility, type, hashedPassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, owner, description, iconPath, bannerPath, visibility, type, hashedPassword]
        );

        const newRoomId = await db.getAsync('SELECT id FROM rooms WHERE name = ?', [name]);
        console.log(newRoomId);
        res.json({ success: true, id: newRoomId.id });
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error while creating room:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});
router.post('/api/create-private-message/:id', async (req: any, res: Response) => {
    try {
        const roomCode = hexGenerator(16);
        const existingRoom1 = await db.getAsync(`
        SELECT * FROM private_message_rooms WHERE receiver_id = ? AND sender_id = ?`,
        [req.params.id, req.user.id]);
        const existingRoom2 = await db.getAsync(`
        SELECT * FROM private_message_rooms WHERE receiver_id = ? AND sender_id = ?`,
        [req.user.id, req.params.id]);

        if (existingRoom1 || existingRoom2) {
            console.error("Private message room already exists");
            let existingRoomCode = '';
            if (existingRoom1) {
                existingRoomCode = existingRoom1.encrypted_id;
            } else if (existingRoom2) {
                existingRoomCode = existingRoom2.encrypted_id;
            }
            res.status(200).json({ success: true, error: 'Private message room already exists', encryptedId: existingRoomCode });        } else {
            db.run(`
                INSERT INTO private_message_rooms 
                (encrypted_id, sender_id, receiver_id)
                VALUES (?, ?, ?)    
            `, [ roomCode, req.user.id, req.params.id ], (err: any) => {
                if (err) {
                    console.error("Error creating new private message room:", err.message);
                    res.status(500).json({ success: true, error: `Error creating private message room: ${err.message}` });
                } else {
                    console.log("Created room with code", roomCode);
                    res.status(200).json({ success: true, encryptedId: roomCode });
                }
            });
            return;
        }
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error while creating private message:', err.message);
        res.status(500).json({ success: false, error: `Error while creating private message: ${err.message}` });
    }
});
router.get('/api/messages/:id', async (req: Request | any, res: Response) => {
    try {
        const messages = await db.allAsync('SELECT * FROM private_messages WHERE encrypted_id = ?', [req.params.id]);
        const receiverID = await db.getAsync('SELECT receiver_id FROM private_message_rooms WHERE encrypted_id = ?', [req.params.id]);
        const roomID = await db.getAsync('SELECT id FROM private_message_rooms WHERE encrypted_id = ?', [req.params.id]);
        if (messages) {
            const loadedMessages = messages.map((message: { username: string,
                                                            sender_id: number, 
                                                            receiver_id: number, 
                                                            encrypted_message: string,
                                                            avatar: any, 
                                                            timestamp: any }) => ({
                username: message.username,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                content: message.encrypted_message,
                avatar: message.avatar,
                timestamp: message.timestamp,
                encrypted: true,
            }));
            res.status(200).json({ success: true, messages: loadedMessages, receiverID, roomID });
        } else {
            res.json({ success: false, error: 'No messages found for this room' });
        }
    } catch (err: ErrorRequestHandler | any) {
        console.error('Error while getting private messages:', err.message);
        res.status(500).json({ success: false, error: `Error while getting private messages: ${err.message}` });
    }
});

export default router;