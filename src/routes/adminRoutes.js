const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Donation = require('../models/Donation');
const Contact = require('../models/Contact');
const Event = require('../models/Event');

// Auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.adminToken || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = await Admin.findById(decoded.id).select('-password');
        
        if (!req.admin || !req.admin.isActive) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const admin = await Admin.findOne({ username });
        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        admin.lastLogin = new Date();
        await admin.save();
        
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        res.json({
            success: true,
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Get dashboard stats
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisYear = new Date(today.getFullYear(), 0, 1);
        
        const [todayDonations, monthDonations, yearDonations, totalDonations] = await Promise.all([
            Donation.aggregate([
                { $match: { status: 'success', createdAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Donation.aggregate([
                { $match: { status: 'success', createdAt: { $gte: thisMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Donation.aggregate([
                { $match: { status: 'success', createdAt: { $gte: thisYear } } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ]),
            Donation.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
            ])
        ]);
        
        const recentDonations = await Donation.find({ status: 'success' })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('fullName email amount category createdAt receiptNumber');
        
        res.json({
            success: true,
            stats: {
                today: { amount: todayDonations[0]?.total || 0, count: todayDonations[0]?.count || 0 },
                month: { amount: monthDonations[0]?.total || 0, count: monthDonations[0]?.count || 0 },
                year: { amount: yearDonations[0]?.total || 0, count: yearDonations[0]?.count || 0 },
                total: { amount: totalDonations[0]?.total || 0, count: totalDonations[0]?.count || 0 }
            },
            recentDonations
        });
        
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

// Get all donations
router.get('/donations', authMiddleware, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, category, search } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { receiptNumber: { $regex: search, $options: 'i' } }
            ];
        }
        
        const donations = await Donation.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const count = await Donation.countDocuments(query);
        
        res.json({
            success: true,
            donations,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
        
    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch donations' });
    }
});

// Get contacts
router.get('/contacts', authMiddleware, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
    }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const admin = await Admin.findById(req.admin._id);
        const isMatch = await admin.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
});

module.exports = router;
