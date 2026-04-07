const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/regularization/my', protect, supportController.getMyRegularizationRequests);
router.post('/regularization/submit', protect, supportController.createRegularizationRequest);
router.get('/regularization/all', protect, authorize(['manager', 'admin']), supportController.getAllRegularizationRequests);
router.post('/regularization/update-status', protect, authorize(['manager', 'admin']), supportController.updateRegularizationStatus);

module.exports = router;
