const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { assignBonus, getAllBonuses } = require('../controllers/bonusController');

router.use(protect);

// @route   POST /api/bonuses
router.post('/', authorize('Admin'), assignBonus);

// @route   GET /api/bonuses
router.get('/', getAllBonuses);

module.exports = router;
