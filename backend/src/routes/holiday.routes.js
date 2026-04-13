const express = require('express');
const router = express.Router();
const holidayController = require('../controllers/holiday.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', holidayController.getHolidays);
router.post('/', holidayController.addHoliday);
router.put('/:id', holidayController.editHoliday);
router.delete('/:id', holidayController.deleteHoliday);
router.get('/stats', holidayController.getAttendanceStats);

module.exports = router;
