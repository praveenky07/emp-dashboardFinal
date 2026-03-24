const express = require('express');
const router = express.Router();
const { createProject, getProjects, assignProject } = require('../controllers/project.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All project routes require authentication
router.get('/', protect, getProjects);

// Only manager can create/assign projects
router.post('/', protect, authorize(['manager']), createProject);
router.post('/assign', protect, authorize(['manager']), assignProject);

module.exports = router;
