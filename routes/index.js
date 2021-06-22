// --- Modules ----------------------------------------------------------------

const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('bcrypt');
const User = require('../models/user');
const { body, validationResult } = require('express-validator');

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
    res.render('register', { title: 'Register', errors: null, user: req.user });
  }
});

router.post('/register', 
  body('firstName').exists().isAlpha('en-US').isLength({ min: 2 }),
  body('lastName').exists().isAlpha('en-US').isLength({ min: 2 }),
  body('username').exists().isLength({ min: 5 }),
  body('password').exists().isLength({ min: 5 }),
  body('confirmPassword').exists().custom((value, {req}) => {
    if (value == req.body.password) {
      return true;
    }
    else {
      throw new Error('Passwords must be the same');
    }
  }),
  
  async (req, res, next) => {

    const errors = validationResult(req);

    const isMember = req.body.memberCode == process.env.MEMBER_CODE;
    const isAdmin = req.body.adminCode == process.env.ADMIN_CODE;

    if (errors.isEmpty()) {
      
      const hash = await generatePassword(req.body.password);

      const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        hash: hash,
        isMember: isMember,
        isAdmin: isAdmin
      });

      await newUser.save();

      res.redirect('/login');
    }
    else {
      res.render('register', { title: 'Register', errors: errors, user: req.user });
    }
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
