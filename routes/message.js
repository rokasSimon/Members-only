// --- Modules ----------------------------------------------------------------

const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const { body, validationResult } = require('express-validator');

// --- Routes ----------------------------------------------------------------

router.get('/create', (req, res, next) => {
    if (req.isAuthenticated()) {
        res.render('message/create', { title: 'Create a new message', errors: [], user: req.user });
    }
    else {
        res.render('notauth', { title: 'Error', user: req.user });
    }
});

router.post('/create',
    body('title').exists(true, true).withMessage('Message title required'),
    body('text').exists(true, true).withMessage('Message text required'),
    async (req, res, next) => {
        if (req.isAuthenticated()) {
            const errors = validationResult(req);

            if (errors.isEmpty()) {
                const { title, text } = req.body;
                const timestamp = new Date();
                const creator = req.user;

                const newMessage = new Message({
                    title: title,
                    text: text,
                    timestamp: timestamp,
                    creator: creator
                });

                await newMessage.save();

                res.redirect('/');
            }
            else {
                res.render('message/create', { title: 'Create a new message', errors: errors.array(), user: req.user });
            }
        }
        else {
            res.render('notauth', { title: 'Error', user: req.user });
        }
});

router.get('/:id/delete', async (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        const id = req.params.id;
        const message = await Message.findById(id).exec();

        console.log(req.user);
        console.log(message);

        if (req.user._id.equals(message.creator)) {
            res.render('message/delete', { title: 'Deleting message', user: req.user, message: message });
        }
        else {
            res.render('notauth', { title: 'Error', user: req.user });
        }
    }
    else {
        res.render('notauth', { title: 'Error', user: req.user });
    }
});

router.post('/:id/delete', async (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        const id = req.params.id;
        const message = await Message.findById(id).exec();

        if (req.user._id.equals(message.creator)) {
            await message.remove();

            res.redirect('/');
        }
        else {
            res.render('notauth', { title: 'Error', user: req.user });
        }
    }
    else {
        res.render('notauth', { title: 'Error', user: req.user });
    }
});

// --- END ----------------------------------------------------------------

module.exports = router;
