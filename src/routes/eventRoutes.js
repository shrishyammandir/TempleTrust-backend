const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Get all events
router.get('/', async (req, res) => {
    try {
        const { limit } = req.query;
        
        let query = Event.find({ isActive: true, date: { $gte: new Date() } })
            .sort({ date: 1 });
        
        if (limit) {
            query = query.limit(parseInt(limit));
        }
        
        const events = await query;
        
        res.json({ success: true, events });
        
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
});

// Get single event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        res.json({ success: true, event });
        
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch event' });
    }
});

module.exports = router;
