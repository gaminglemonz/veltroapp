#!/usr/bin/env node

import fs from 'fs';
import http from 'http';
import https from 'https';
// import debug from 'debug';
import { Server } from 'socket.io';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import readline from 'readline';
import { join } from 'node:path';
import session from 'express-session';
import passport from 'passport';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
// import passportConfig from '../passport-config';

const app = require('../app')

require('dotenv').config();
require('../passport-config')(passport);

// HTTPS Certificates
const privateKey = fs.readFileSync('./certificates/server.key', 'utf8');
const certificate = fs.readFileSync('./certificates/server.cert', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// HTTP and HTTPS Servers
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const io = new Server(httpsServer);

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

async function main() {
    const db = await open({
        filename: './var/db/veltro.db',
        driver: sqlite3.Database,
    });

    const sessionMiddleware = session({
        secret: process.env.SECRET_KEY || "changeit",
        resave: false,
        saveUninitialized: true,
    });

    app.use(sessionMiddleware);
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(express.urlencoded({ extended: false }));

    app.get("/login", (req: Request, res: Response) => {
        if (req.user) {
            return res.redirect("/");
        }
        res.render("login");
    });
    app.post(
        "/login",
        passport.authenticate("local", {
            successRedirect: "/",
            failureRedirect: "/login",
        })
    );

    io.on('connection', async (socket) => {
        const username = socket.handshake.query.username;
        const roomId: any = socket.handshake.query.roomId, roomName = socket.handshake.query.roomName;
        const timestamp = new Date().toISOString();

        socket.join(roomId);
        console.log(`${username} connected to room ${roomId} (${roomName}) at ${timestamp}`);
        io.to(roomId).emit('user joined', username);


        socket.on('message', async (data) => {
            const { roomId, user, avatar, msg } = data;
            const timestamp = new Date().toISOString();
            await db.run('INSERT INTO messages (room_id, avatar, content, username, timestamp) VALUES (?, ?, ?, ?, ?)', 
                [roomId, avatar, msg, user, timestamp]);

            io.to(roomId).emit('message', { user, msg, avatar, timestamp });
        });
        socket.on('user typing', async (data) => {
            const { roomId, user } = data;
            io.to(roomId).emit('user typing', user);
        });
        socket.on('ping', () => {
            io.emit('pong');
        });
        socket.on('recorded ping', (ping) => {
            console.log(`Client from ${username} received ping of ${ping}`);
        });

        socket.on('disconnect', async () => {
            console.log(`${username} disconnected from room ${roomId} (${roomName}) at ${timestamp}`);
            io.to(roomId).emit('user left', username);
        });
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.on('line', (input) => {
        console.log(`<Console> ${input}`);
        io.emit('message', { user: 'Console', msg: input });
    });
}

main();

httpsServer.listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
});

httpServer.on('request', (req, res) => {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
});

httpServer.listen(80, () => {
    console.log('HTTP Server running on port 80 (redirecting to HTTPS)');
});

function normalizePort(val: string): number | string | boolean {
    const port = parseInt(val, 10);
    return isNaN(port) ? val : (port >= 0 ? port : false);
}

function onError(error: { syscall: string, code: string } | any): void {
    if (error.syscall !== 'listen') throw error;
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
