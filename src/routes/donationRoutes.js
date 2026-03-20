const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting
const donationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 donations per window
    message: 'Too many donation attempts, please try again later'
});

// Validation middleware
const donationValidation = [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('amount').isInt({ min: 1 }).withMessage('Amount must be at least 1'),
    body('pan').optional().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN format')
];

// Create Razorpay order
router.post('/create-order', donationLimiter, donationValidation, donationController.createRazorpayOrder);

// Verify Razorpay payment
router.post('/verify-payment', donationController.verifyRazorpayPayment);

// Create UPI pending donation
router.post('/upi-pending', donationValidation, donationController.createUPIDonation);

// Get donation receipt
router.get('/receipt/:receiptNumber', donationController.generateReceipt);

// Webhook for Razorpay
router.post('/webhook', donationController.razorpayWebhook);

module.exports = router;
