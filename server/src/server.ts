#!/usr/bin/env node

import fs from 'fs';
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import readline from 'readline';
import session from 'express-session';
import passport from 'passport';
import express, { Request, Response } from 'express';
import { fileURLToPath } from 'node:url';
import path from 'path';
import app from './app.js';
import passportConfig from '../passport-config.js';
import * as dotenv from 'dotenv';

dotenv.config();
passportConfig(passport);

const HTTP_PORT = normalizePort(process.env.HTTP_PORT || '5000');
const HTTPS_PORT = normalizePort(process.env.HTTPS_PORT || '5001');

const privateKey = fs.readFileSync('./certificates/server.key', 'utf8');
const certificate = fs.readFileSync('./certificates/server.cert', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const ioHTTP = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});
const ioHTTPS = new Server(httpsServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

let db: any;

const setupSocket = (io: Server) => {
    io.on('connection', async (socket: any) => {
        const username: string = socket.handshake.query.username;
        const roomId = socket.handshake.query.roomId;
        const roomName = socket.handshake.query.roomName;
        const timestamp = new Date().toISOString();

        socket.join(roomId);
        console.log(`${username} connected to room ${roomId} (${roomName}) at ${timestamp}`);
        io.to(roomId).emit('user joined', username);

        socket.on('message', async (data: { roomId: string | string[], user: string, avatar: any, msg: string }) => {
            const { roomId, user, avatar, msg } = data;
            const msgTimestamp = new Date().toISOString();
            try {
                await db.run(
                    'INSERT INTO messages (room_id, avatar, content, username, timestamp) VALUES (?, ?, ?, ?, ?)',
                    [roomId, avatar, msg, user, msgTimestamp]
                );
                io.to(roomId).emit('message', { user, msg, avatar, timestamp: msgTimestamp });
            } catch (error) {
                console.error('Error inserting message:', error);
            }
        });

        socket.on('user typing', (data: { roomId: string | string[], user: string }) => {
            const { roomId, user } = data;
            io.to(roomId).emit('user typing', user);
        });

        socket.on('ping', () => {
            io.emit('pong');
        });

        socket.on('recorded ping', (ping: number) => {
            console.log(`Client from ${username} received ping of ${ping}`);
        });

        socket.on('disconnect', async () => {
            console.log(`${username} disconnected from room ${roomId} (${roomName}) at ${timestamp}`);
            io.to(roomId).emit('user left', username);
        });
    });
};

setupSocket(ioHTTP);
setupSocket(ioHTTPS);

async function main() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const dbPath = path.join(__dirname, '../var/db/veltro.db');
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        console.log('Connected to SQLite database at:', dbPath);

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.on('line', (input: string) => {
            console.log(`<Console> ${input}`);
            ioHTTP.emit('message', { user: 'Console', msg: input });
            ioHTTPS.emit('message', { user: 'Console', msg: input });
        });

        // Start the servers
        httpServer.listen(HTTP_PORT, () => {
            console.log(`HTTP Server running on port ${HTTP_PORT}`);
        });
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});

function normalizePort(val: string): number | string | boolean {
    const port = parseInt(val, 10);
    return isNaN(port) ? val : (port >= 0 ? port : false);
}
