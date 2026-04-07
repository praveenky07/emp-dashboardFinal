const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');


router.get('/users', protect, authorize(['admin']), adminController.getAllUsers);
router.post('/user-role', protect, authorize(['admin']), adminController.updateUserRole);
router.post('/update-employee', protect, authorize(['admin']), adminController.updateEmployeeDetails);
router.delete('/user/:id', protect, authorize(['admin']), adminController.deleteUser);
router.get('/settings', protect, authorize(['admin']), adminController.getSystemSettings);
router.post('/settings', protect, authorize(['admin']), adminController.updateSetting);
router.get('/logs', protect, authorize(['admin']), adminController.getActivityLogs);
router.get('/salary-history', protect, authorize(['admin']), adminController.getSalaryHistory);
router.get('/metrics', protect, authorize(['admin']), adminController.getPerformanceMetrics);

router.get('/active-sessions', protect, authorize(['admin']), adminController.getActiveSessions);
router.get('/stats', protect, authorize(['admin']), adminController.getAdminStats);
router.get('/leaves', protect, authorize(['admin']), adminController.getAllLeaves);
router.get('/meetings', protect, authorize(['admin']), adminController.getAllMeetings);
router.post('/backup', protect, authorize(['admin']), adminController.backupDatabase);


module.exports = router;
