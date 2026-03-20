const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

router.get('/users', adminController.getAllUsers);
router.post('/user-role', adminController.updateUserRole);
router.delete('/user/:id', adminController.deleteUser);
router.get('/settings', adminController.getSystemSettings);
router.post('/settings', adminController.updateSetting);
router.get('/logs', adminController.getActivityLogs);
router.get('/metrics', adminController.getPerformanceMetrics);
router.get('/active-sessions', adminController.getActiveSessions);
router.post('/backup', adminController.backupDatabase);

module.exports = router;
