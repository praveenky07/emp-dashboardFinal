const express = require('express');
const router = express.Router();
const benefitsController = require('../controllers/benefits.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/plans', protect, benefitsController.getBenefitPlans);
router.get('/my', protect, benefitsController.getMyBenefits);
router.post('/enroll', protect, benefitsController.enrollInBenefit);
router.put('/update', protect, benefitsController.updateBenefitEnrollment);

module.exports = router;
