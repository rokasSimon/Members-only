const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const crypto = require('bcrypt');
require('dotenv').config();

const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_CSTR, { useNewUrlParser: true , useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const UserSchema = new mongoose.Schema({
  username: String,
  hash: String
});

mongoose.model('User', UserSchema);

const sessionStore = new MongoStore({
  mongooseConnection: db,
  collection: 'sessions'
});

function validPassword(password, hash, salt) {
  var hashVerify = crypto.
  return hash === hashVerify;
}
function genPassword(password) {
  var salt = crypto.randomBytes(32).toString('hex');
  var genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  
  return {
    salt: salt,
    hash: genHash
  };
}

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
