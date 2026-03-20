const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');

// Submit contact form
router.post('/submit', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        
        const { name, email, phone, subject, message } = req.body;
        
        const contact = new Contact({
            name,
            email,
            phone,
            subject,
            message,
            ipAddress: req.ip
        });
        
        await contact.save();
        
        res.json({ success: true, message: 'Message sent successfully' });
        
    } catch (error) {
        console.error('Contact submit error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

module.exports = router;
