const Razorpay = require('razorpay');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const { sendDonationEmail, sendAdminNotification } = require('../utils/emailService');
const { generatePDFReceipt } = require('../utils/pdfGenerator');

// Initialize Razorpay (lazy - only if valid credentials are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes('xxxxxxxxxx')) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
} else {
    console.warn('⚠️  Razorpay credentials not configured - payment features disabled');
}

// Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { fullName, email, phone, pan, address, category, amount, dedication } = req.body;

        // Create donation record
        const donation = new Donation({
            fullName,
            email,
            phone,
            pan,
            address,
            category,
            amount,
            dedication,
            paymentMethod: 'razorpay',
            status: 'pending',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        await donation.save();

        // Create Razorpay order
        const options = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: donation._id.toString(),
            notes: {
                donationId: donation._id.toString(),
                category,
                fullName
            }
        };

        const order = await razorpay.orders.create(options);

        // Update donation with order ID
        donation.razorpayOrderId = order.id;
        await donation.save();

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            donationId: donation._id
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create order' 
        });
    }
};

// Verify Razorpay Payment
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature, donationId } = req.body;

        // Verify signature
        const text = razorpayOrderId + '|' + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');

        if (expectedSignature !== razorpaySignature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid payment signature' 
            });
        }

        // Update donation status
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Donation not found' 
            });
        }

        donation.razorpayPaymentId = razorpayPaymentId;
        donation.razorpaySignature = razorpaySignature;
        donation.status = 'success';
        await donation.save();

        // Send confirmation email
        try {
            const pdfBuffer = await generatePDFReceipt(donation);
            await sendDonationEmail(donation, pdfBuffer);
            await sendAdminNotification(donation);
            
            donation.receiptGenerated = true;
            donation.receiptSent = true;
            await donation.save();
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            // Don't fail the payment if email fails
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            donation: {
                receiptNumber: donation.receiptNumber,
                amount: donation.amount,
                category: donation.category,
                createdAt: donation.createdAt,
                razorpayPaymentId: donation.razorpayPaymentId
            }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment verification failed' 
        });
    }
};

// Create UPI Donation (Pending)
exports.createUPIDonation = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { fullName, email, phone, pan, address, category, amount, dedication } = req.body;

        const donation = new Donation({
            fullName,
            email,
            phone,
            pan,
            address,
            category,
            amount,
            dedication,
            paymentMethod: 'upi',
            status: 'pending',
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        await donation.save();

        res.json({
            success: true,
            message: 'UPI donation request recorded. Please complete the payment.',
            donationId: donation._id
        });

    } catch (error) {
        console.error('UPI donation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create donation' 
        });
    }
};

// Generate Receipt PDF
exports.generateReceipt = async (req, res) => {
    try {
        const { receiptNumber } = req.params;

        const donation = await Donation.findOne({ receiptNumber });
        if (!donation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Receipt not found' 
            });
        }

        if (donation.status !== 'success') {
            return res.status(400).json({ 
                success: false, 
                message: 'Receipt not available for pending donations' 
            });
        }

        const pdfBuffer = await generatePDFReceipt(donation);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${receiptNumber}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Generate receipt error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to generate receipt' 
        });
    }
};

// Razorpay Webhook
exports.razorpayWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];

        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        const event = req.body.event;
        const payment = req.body.payload.payment.entity;

        if (event === 'payment.captured') {
            const donation = await Donation.findOne({ razorpayOrderId: payment.order_id });
            if (donation && donation.status === 'pending') {
                donation.status = 'success';
                donation.razorpayPaymentId = payment.id;
                await donation.save();
                
                // Send emails
                const pdfBuffer = await generatePDFReceipt(donation);
                await sendDonationEmail(donation, pdfBuffer);
                await sendAdminNotification(donation);
            }
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};
