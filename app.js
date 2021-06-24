// --- Init ----------------------------------------------------------------

require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const crypto = require('bcrypt');
const MongoStore = require('connect-mongo');
const User = require('./models/user');

const app = express();

// --- Database ----------------------------------------------------------------

const mongoose = require('mongoose');
mongoose.connect(process.env.DB_CSTR, { useNewUrlParser: true , useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// --- Passport ----------------------------------------------------------------

passport.use(new LocalStrategy(function (username, password, callback) {
  User.findOne({ username: username }).then((user) => {
    if (!user) {
      return callback(null, false, { message: 'Incorrect username' });
    }

    crypto.compare(password, user.hash).then((validPassword) => {
      if (validPassword) {
        return callback(null, user);
      }
      else {
        return callback(null, false, { message: 'Incorrect password' });
      }
    });
  }).catch((err) => {
    callback(err);
  });
}));

passport.serializeUser((user, callback) => {
  callback(null, user.id);
});

passport.deserializeUser((id, callback) => {
  User.findById(id, (err, user) => {
    if (err) callback(err);

    callback(null, user);
  });
});

// --- Routing ----------------------------------------------------------------

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const messageRouter = require('./routes/message');

// --- Middleware order ----------------------------------------------------------------

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
  store: MongoStore.create({ mongoUrl: process.env.DB_CSTR }),
  cookie: {
    maxAge: 1000 * 60 * 30
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- Routing middleware ----------------------------------------------------------------

app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/message', messageRouter);

// --- Error handling ----------------------------------------------------------------

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

// --- END ----------------------------------------------------------------

module.exports = app;
