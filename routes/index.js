// --- Modules ----------------------------------------------------------------

const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('bcrypt');
const User = require('../models/user');
const Message = require('../models/message');
const { body, validationResult } = require('express-validator');

// --- Generate password ----------------------------------------------------------------

async function generatePassword(password) {
  const rounds = parseInt(process.env.HASH_ROUND);
  const hash = await crypto.hash(password, rounds);
  
  return hash;
}

// --- Routes ----------------------------------------------------------------

/* GET home page. */
router.get('/', async (req, res, next) => {
  if (req.isAuthenticated()) {
    const messages = await Message.find({}).populate('creator').exec();

    res.render('index', { title: 'Home', user: req.user, messages: messages });
  }
  else {
    res.render('index', { title: 'Home', user: req.user, messages: [] });
  }
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
    res.render('register', { title: 'Register', errors: [], user: req.user });
  }
});

router.post('/register', 
  body('firstName').exists(true, true).withMessage('First name is required')
                   .isAlpha('en-US').withMessage('First name must consist of alphabetic letters')
                   .isLength({ min: 2 }).withMessage('First name must be at least 2 letters long'),
  body('lastName').exists(true, true).withMessage('Last name is required')
                  .isAlpha('en-US').withMessage('Last name must consist of alphabetic letters')
                  .isLength({ min: 2 }).withMessage('Last name must be at least 2 letters long'),
  body('username').exists(true, true).withMessage('Username is required')
                  .isLength({ min: 5 }).withMessage('Username must be at least 5 letters long'),
  body('password').exists(true, true).withMessage('Password is required')
                  .isLength({ min: 5 }).withMessage('Password must be at least 5 letters long'),
  body('confirmPassword').exists(true, true).withMessage('Confirmation password is required')
                  .custom((value, {req}) => {
    if (value == req.body.password) {
      return true;
    }
    else {
      throw new Error('Passwords must be the same');
    }
  }),
  body('memberCode').custom((value, { req }) => {
    if (value) {
      if (value == process.env.MEMBER_CODE) {
        return true;
      }
      else {
        throw new Error('Incorrect membership code');
      }
    }
    else {
      return true;
    }
  }),
  body('adminCode').custom((value, { req }) => {
    if (value) {
      if (value == process.env.ADMIN_CODE) {
        return true;
      }
      else {
        throw new Error('Incorrect admin code');
      }
    }
    else {
      return true;
    }
  }),
  async (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      
      const isMember = req.body.memberCode == process.env.MEMBER_CODE;
      const isAdmin = req.body.adminCode == process.env.ADMIN_CODE;
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
      res.render('register', { title: 'Register', errors: errors.array(), user: req.user });
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
