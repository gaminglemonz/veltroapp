require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const session = require('express-session');
const multer = require('multer');
const SQLiteStore = require('connect-sqlite3')(session);

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

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
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({ db: 'sessions.db', dir: '../var/db' })
}));
app.use(passport.authenticate('session'));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

app.use('/', indexRouter);
app.use('/', authRouter);

app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});
app.get('/profile', (req, res) => {
    res.render('profile', { user: req.user });
});
app.get('/header', (req, res) => {
    res.render('header', { user: req.user })
})


// Catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// Handle Image Uploading
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.orginalname))
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).single('avatar');

const checkFileType = (file, cb) => {
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
app.use((err, req, res, next) => {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    // Render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
