const express = require('express');
const router = express.Router();
const {
  getCrops,
  getMyCrops,
  getCropById,
  addCrop,
  updateCrop,
  deleteCrop,
} = require('../controllers/cropController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(getCrops).post(protect, addCrop);
router.route('/mine').get(protect, getMyCrops);
router.route('/:id').get(getCropById).put(protect, updateCrop).delete(protect, deleteCrop);

module.exports = router;
