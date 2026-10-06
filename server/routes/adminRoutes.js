const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  getListings,
  moderateListing,
  getAiMonitoring,
  getLogs
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/listings', getListings);
router.put('/listings/:id/moderate', moderateListing);
router.get('/ai-monitoring', getAiMonitoring);
router.get('/logs', getLogs);

module.exports = router;
