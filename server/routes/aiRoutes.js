const express = require('express');
const router = express.Router();
const { analyzeListing } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// Can be called during listing drafting / creation
router.post('/analyze-listing', protect, analyzeListing);

module.exports = router;
