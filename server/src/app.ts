import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import createError from 'http-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import passport from 'passport';
import multer from 'multer';
import router from './routes.js';
import connectSqlite3 from 'connect-sqlite3';
import session, { Store } from 'express-session';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const SQLiteStore = connectSqlite3(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: [ 'http://localhost:5173', 'http://localhost:3000' ],
    credentials: true,
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../../client/dist')));

app.use(session({
    store: new (SQLiteStore as any)({
        db: 'sessions.db',
        dir: path.resolve(__dirname, '../var/db'),
        table: 'sessions'
    }) as Store,
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false,
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'pug');
app.use('/', router);

app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.user = req.user || null;
    next();
});

app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req: Request, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const checkFileType = (file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Something went wrong. Image size is too large, or not the correct type.\nOnly use PNG, JPG, or WEBP files under 5 MB'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('avatar');

app.use((err: ErrorRequestHandler | any, req: Request, res: Response, next: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.json({ error: err.message });
});

export default app;
