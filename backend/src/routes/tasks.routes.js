const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, authorize(['manager', 'admin', 'hr']), tasksController.createTask);
router.get('/my', protect, tasksController.getMyTasks);
router.get('/managed', protect, authorize(['manager', 'admin', 'hr']), tasksController.getManagedTasks);
router.put('/status', protect, tasksController.updateTaskStatus);

module.exports = router;
