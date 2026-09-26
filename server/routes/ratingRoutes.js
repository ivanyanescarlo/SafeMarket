const express = require('express');
const router = express.Router();
const { createRating, getSellerRatings } = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createRating);
router.get('/seller/:sellerId', getSellerRatings);

module.exports = router;
