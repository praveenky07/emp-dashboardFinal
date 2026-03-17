const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { startBreak, endBreak, getBreaks } = require('../controllers/breakController');

router.use(protect);

// @route   GET /api/breaks
router.get('/', getBreaks);

// @route   POST /api/breaks/start
router.post('/start', startBreak);

// @route   POST /api/breaks/end
router.post('/end', endBreak);

module.exports = router;
