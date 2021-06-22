// --- Modules ----------------------------------------------------------------

const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('bcrypt');
const User = require('../models/user');

// --- Generate password ----------------------------------------------------------------

async function generatePassword(password) {
  const rounds = parseInt(process.env.HASH_ROUND);
  const hash = await crypto.hash(password, rounds);
  
  return hash;
}

// --- Routes ----------------------------------------------------------------

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Home', user: req.user });
});

router.get('/login', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect('/');
  }
  else {
    res.render('login', { title: 'Login', user: req.user });
  }
});

router.post('/login', passport.authenticate('local', {
              successRedirect: '/',
              failureRedirect: '/login'
            })
);

router.get('/register', (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect('/');
  }
  else {
    res.render('register', { title: 'Register', user: req.user });
  }
});

router.post('/register', async (req, res, next) => {
  const hash = await generatePassword(req.body.password);
  const newUser = new User({
    username: req.body.username,
    hash: hash
  });

  await newUser.save();

  res.redirect('/login');

});

router.get('/signout', (req, res, next) => {
  if (req.isUnauthenticated()) {
    res.redirect('back');
  }
  else {
    req.logOut();
    res.redirect('back');
  }
});

module.exports = router;
