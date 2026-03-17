const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
    getAllEmployees, 
    getEmployeeById, 
    createEmployee, 
    updateEmployee, 
    deleteEmployee 
} = require('../controllers/employeeController');

// Apply protection middleware to all employee routes
router.use(protect);

router.route('/')
    .get(authorize('Admin', 'Manager'), getAllEmployees)
    .post(authorize('Admin'), createEmployee);

router.route('/:id')
    .get(getEmployeeById) // Logic inside controller handles employee-only access
    .put(authorize('Admin'), updateEmployee)
    .delete(authorize('Admin'), deleteEmployee);

module.exports = router;
