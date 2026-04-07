const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public/Employee access
router.get('/', protect, departmentController.getAllDepartments);

// Admin only access for management
router.post('/', protect, authorize(['admin']), departmentController.createDepartment);
router.put('/:id', protect, authorize(['admin']), departmentController.updateDepartment);
router.delete('/:id', protect, authorize(['admin']), departmentController.deleteDepartment);

module.exports = router;
