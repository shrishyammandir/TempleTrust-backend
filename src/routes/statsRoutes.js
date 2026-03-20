const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Event = require('../models/Event');

// Get public stats
router.get('/public', async (req, res) => {
    try {
        const [donationStats, eventCount] = await Promise.all([
            Donation.aggregate([
                { $match: { status: 'success' } },
                { $group: { 
                    _id: null, 
                    totalAmount: { $sum: '$amount' },
                    totalDonors: { $sum: 1 }
                }}
            ]),
            Event.countDocuments({ isActive: true })
        ]);
        
        const stats = {
            totalDonors: donationStats[0]?.totalDonors || 0,
            totalAmount: donationStats[0]?.totalAmount || 0,
            totalEvents: eventCount || 0
        };
        
        res.json(stats);
        
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

module.exports = router;
