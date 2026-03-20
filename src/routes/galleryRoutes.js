const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');

// Get all gallery images
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        
        const query = { isActive: true };
        if (category && category !== 'all') {
            query.category = category;
        }
        
        const images = await Gallery.find(query).sort({ createdAt: -1 });
        
        res.json({ success: true, images });
        
    } catch (error) {
        console.error('Get gallery error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
    }
});

module.exports = router;
