#!/usr/bin/env node


import * as dotenv from 'dotenv';
dotenv.config();

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
import crypto from 'crypto';

passportConfig(passport);

const HTTP_PORT = normalizePort(process.env.HTTP_PORT || '3000');

const httpServer = http.createServer(app);

const ioHTTP = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

let db: any;

const setupSocket = (io: Server) => {
    io.on('connection', async (socket: any) => {
        const username: string = socket.handshake.query.username;
        const userID: number = socket.handshake.query.userID;
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
        socket.on('private message', async (data: { PMID: string | string[], name: string, roomID: number, receiverID: number, avatar: any, msg: string }) => {
            const { PMID, name, avatar, msg, receiverID } = data;
            const msgTimestamp = new Date().toISOString();

            let encryptedMessage = '';
            if (typeof msg === 'string') {
                const cipher = crypto.createCipheriv(
                    'aes-256-cbc',
                    Buffer.from(process.env.AES_KEY as string, 'hex'),
                    Buffer.from(process.env.AES_IV as string, 'hex')
                );
                encryptedMessage = cipher.update(msg, 'utf8', 'hex') + cipher.final('hex');
            } else {
                throw new Error('Message to encrypt must be a string');
            }
            try {
                await db.run(
                    `INSERT INTO private_messages (encrypted_id, avatar, encrypted_message, username, timestamp, 
                    sender_id, receiver_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [PMID, avatar, encryptedMessage, name, msgTimestamp, userID, receiverID]
                );
                io.to(roomId).emit('private message', { name, msg, avatar, timestamp: msgTimestamp, userID, receiverID });
            } catch (error) {
                console.error('Error inserting message:', error);
            }
        });

        socket.on('user typing public', (data: { roomId: string | string[], user: string }) => {
            const { roomId, user } = data;
            io.to(roomId).emit('user typing', user);
        });

        socket.on('user typing private', (data: { PMID: string | string[], user: string }) => {
            const { PMID, user } = data;
            io.to(PMID).emit('user typing private', user);
        });

        socket.on('disconnect', async () => {
            console.log(`${username} disconnected from room ${roomId} (${roomName}) at ${timestamp}`);
            io.to(roomId).emit('user left', username);
        });
    });
};

setupSocket(ioHTTP);

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
        });

        httpServer.listen(HTTP_PORT, () => {
            console.log(`HTTP Server running on port ${HTTP_PORT}`);
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
