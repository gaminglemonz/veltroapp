import fs from "fs";
import sqlite3 from 'sqlite3';
import path from "path";
import { fileURLToPath } from "url";
import { Server } from 'socket.io';
import { open } from 'sqlite';
import app from './dist/app.js';

export default async function setupSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5000',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const dbPath = path.resolve(__dirname, '../var/db/veltro.db');
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    io.use((socket, next) => {
        app.use(socket.request, {}, next);
    });

    io.on('connection', async (socket) => {
        const user = socket.request.session.passport?.user;

        if (!user) {
            socket.disconnect();
            return;
        }

        socket.on('join room', async ({ room }) => {
            socket.join(room.id);
            console.log(`${user.username} joined room ${room.id}`);
        });

        socket.on('message', async (data) => {
            try {
                const { roomId, msg } = data;
                // Store message in database
                await db.run(
                    'INSERT INTO messages (room_id, user_id, content) VALUES (?, ?, ?)',
                    [roomId, user.id, msg]
                );
                // Broadcast to room
                io.to(roomId).emit('message', {
                    user: user.username,
                    msg,
                    timestamp: new Date(),
                    avatar: user.avatar
                });
            } catch (err) {
                console.error('Error handling message:', err);
                socket.emit('error', 'Failed to send message');
            }
        });

        socket.on('user typing', ({ roomId }) => {
            socket.to(roomId).emit('user typing', user.username);
        });

        socket.on('disconnect', () => {
            console.log(`${user.username} disconnected`);
        });
    });

    return io;
}