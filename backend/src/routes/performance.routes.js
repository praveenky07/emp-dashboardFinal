const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performance.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, performanceController.getPerformanceData);
router.post('/submit-review', protect, authorize(['admin', 'manager']), performanceController.submitReview);
router.get('/reviews/my', protect, performanceController.getMyReviews);
router.get('/reviews/:employeeId', protect, performanceController.getReviewsByEmployeeId);
router.get('/team-reviews', protect, authorize(['admin', 'manager']), performanceController.getTeamReviews);
router.get('/bonus/:employeeId', protect, performanceController.getBonusHistory);
router.get('/bonus', protect, performanceController.getBonusHistory);
router.post('/submit-bonus', protect, authorize(['admin', 'manager']), performanceController.submitBonus);

module.exports = router;

