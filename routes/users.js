// --- Modules ----------------------------------------------------------------

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// --- Routes ----------------------------------------------------------------

router.get('/:id', function(req, res, next) {
  const id = req.params.id;

  if (req.isAuthenticated() && req.user._id.equals(id)) {
    res.render('profile/details', { title: 'Your profile', user: req.user });
  }
  else {
    res.render('notauth', { title: 'Error', user: req.user });
  }
});

router.get('/:id/edit', function(req, res, next) {
  const id = req.params.id;

  if (req.isAuthenticated() && req.user._id.equals(id)) {
    res.render('profile/edit', { title: 'Edit your profile', errors: [], user: req.user });
  }
  else {
    res.render('notauth', { title: 'Error', user: req.user });
  }
});

router.post('/:id/edit', 
  body('firstName').exists(true, true).withMessage('First name is required')
                   .isAlpha('en-US').withMessage('First name must consist of alphabetic letters')
                   .isLength({ min: 2 }).withMessage('First name must be at least 2 letters long'),
  body('lastName').exists(true, true).withMessage('Last name is required')
                  .isAlpha('en-US').withMessage('Last name must consist of alphabetic letters')
                  .isLength({ min: 2 }).withMessage('Last name must be at least 2 letters long'),
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

    const id = req.params.id;
    if (req.isAuthenticated() && req.user._id.equals(id)) {
      const errors = validationResult(req);

      if (errors.isEmpty()) {
        const user = req.user;
        
        const isMember = user.isMember || req.body.memberCode == process.env.MEMBER_CODE;
        const isAdmin = user.isAdmin || req.body.adminCode == process.env.ADMIN_CODE;
  
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.isMember = isMember;
        user.isAdmin = isAdmin;

        await user.save();
  
        res.redirect(user.url);
      }
      else {
        res.render('profile/edit', { title: 'Edit your profile', errors: errors.array(), user: req.user });
      }
    }
    else {
      res.render('notauth', { title: 'Error', user: req.user });
    }
});

// --- END ----------------------------------------------------------------

module.exports = router;
