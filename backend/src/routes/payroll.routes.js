const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Structure
router.get('/structure/my', protect, payrollController.getSalaryStructure);
router.get('/structure/all', protect, authorize(['admin', 'hr']), payrollController.getAllSalaryStructures);
router.post('/structure', protect, authorize(['admin', 'hr']), payrollController.setSalaryStructure);

// Payroll
router.get('/my', protect, payrollController.getMyPayslips);
router.get('/all', protect, authorize(['admin', 'hr', 'manager']), payrollController.getAllPayslips);
router.post('/generate', protect, authorize(['admin', 'hr']), payrollController.generatePayroll);
router.get('/download/:id', protect, payrollController.downloadPayslip);

module.exports = router;
