const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  updateReportStatus
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

router.post('/', protect, createReport);
router.get('/', protect, requireAdmin, getReports);
router.put('/:id/status', protect, requireAdmin, updateReportStatus);

module.exports = router;
