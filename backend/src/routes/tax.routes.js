const express = require('express');
const router = express.Router();
const taxController = require('../controllers/tax.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/my', protect, taxController.getMyTaxDeclarations);
router.post('/submit', protect, taxController.createTaxDeclaration);
router.put('/update', protect, taxController.updateTaxDeclaration);
router.get('/all', protect, authorize(['manager', 'admin']), taxController.getAllDeclarations);
router.post('/approve', protect, authorize(['admin']), taxController.approveTaxDeclaration);

module.exports = router;
