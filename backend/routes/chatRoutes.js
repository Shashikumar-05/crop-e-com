const express = require('express');
const router = express.Router();
const { getAgriAdvice, handleAssistantChat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, getAgriAdvice);
router.post('/assistant', protect, handleAssistantChat);

module.exports = router;
