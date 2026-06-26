const express = require('express');
const router = express.Router();
const { sendEnquiry } = require('../controllers/enquiryController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendEnquiry);

module.exports = router;
