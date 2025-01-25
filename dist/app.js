"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const http_errors_1 = __importDefault(require("http-errors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
const multer_1 = __importDefault(require("multer"));
const SQLiteStore = require('connect-sqlite3')(express_session_1.default);
const authRouter = require('./routes/routes');
const app = (0, express_1.default)();
// View engine setup
app.set('views', path_1.default.join(__dirname, 'views/templates'));
app.set('view engine', 'ejs');
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use((0, express_session_1.default)({
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
app.use(passport_1.default.authenticate('session'));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});
app.use('/', authRouter);
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});
app.get('/profile', (req, res) => {
    res.render('profile', { user: req.user });
});
app.get('/dashboard', (req, res) => {
    res.render('dashboard', { user: req.user });
});
app.get('/rooms', (req, res) => {
    res.render('rooms', { user: req.user });
});
app.get('/header', (req, res) => {
    res.render('header', { user: req.user });
});
// Catch 404 and forward to error handler
app.use((req, res, next) => {
    next((0, http_errors_1.default)(404));
});
// Handle Image Uploading
const storage = multer_1.default.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('avatar');
const checkFileType = (file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb('Something went wrong. Image size is to large, or not the correct type.\nOnly use PNG, JPG, or WEBP files under 5 MB');
    }
};
// Error handler
app.use((err, req, res, next) => {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // Render the error page
    res.status(err.status || 500);
    res.render('error');
});
module.exports = app;
