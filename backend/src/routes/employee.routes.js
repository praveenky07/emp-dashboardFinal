const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');

router.post('/', employeeController.addEmployee);
router.get('/', employeeController.getEmployees);
router.post('/attendance', employeeController.markAttendance);
router.get('/attendance/:employeeId', employeeController.getAttendance);

module.exports = router;
