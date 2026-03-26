const express = require('express');
const router = express.Router();
const adjustmentController = require('../controllers/adjustment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/add', protect, authorize(['admin', 'hr']), adjustmentController.addAdjustment);
router.get('/month', protect, authorize(['admin', 'hr', 'manager']), adjustmentController.getAdjustmentsForMonth);

module.exports = router;
