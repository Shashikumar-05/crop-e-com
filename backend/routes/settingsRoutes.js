const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect } = require('../middleware/authMiddleware');

// Get settings (public)
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ supportPhone: '+919876543210' });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update settings (Manager only)
router.put('/', protect, async (req, res) => {
  try {
    // Basic check if user is manager
    if (req.user && req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Not authorized as Manager' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ supportPhone: req.body.supportPhone || '+919876543210' });
    } else {
      if (req.body.supportPhone) {
        settings.supportPhone = req.body.supportPhone;
      }
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
