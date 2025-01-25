require('dotenv').config();

import express, { Request, Response, ErrorRequestHandler, NextFunction } from 'express';
import createError from 'http-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import passport from 'passport';
import session from 'express-session';
import multer from 'multer';
const SQLiteStore = require('connect-sqlite3')(session);

const authRouter = require('./routes/routes');

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views/templates'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    store: new SQLiteStore({
        dir: '../var/db',
        table: 'sessions',
        db: 'sessions.db'
    }),
    secret: process.env.SESSION_SECRET || '436cea9c55892e4b73fd7eb4c1418a6ae5e72c78bf466a0f0eaad8d285bdc0e3455adb6febeb65380c3c68d33de27969971459425aee9098bb86fae9d123158e',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
    }
}));
app.use(passport.authenticate('session'));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

app.use('/', authRouter);

app.get('/', (req: Request, res: Response) => {
    res.render('index', { user: req.user });
});
app.get('/profile', (req: Request, res: Response) => {
    res.render('profile', { user: req.user });
});
app.get('/dashboard', (req: Request, res: Response) => { 
    res.render('dashboard', { user: req.user });
});
app.get('/rooms', (req: Request, res: Response) => {
    res.render('rooms', { user: req.user })
});
app.get('/header', (req: Request, res: Response) => {
    res.render('header', { user: req.user })
})

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// Handle Image Uploading
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req: Request, file: { fieldname: string, originalname: string }, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('avatar');

const checkFileType = (file: { mimetype: string, originalname: string }, cb: any) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Something went wrong. Image size is to large, or not the correct type.\nOnly use PNG, JPG, or WEBP files under 5 MB');
    }
}

// Error handler
app.use((err: ErrorRequestHandler | any, req: Request, res: Response, next: NextFunction) => {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    // Render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
