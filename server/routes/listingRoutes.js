const express = require('express');
const router = express.Router();
const {
  createListing,
  getListings,
  getListingById,
  getMyListings,
  updateListing,
  deleteListing,
  markSoldAndRequestRating
} = require('../controllers/listingController');
const { protect, optionalAuth } = require('../middleware/auth');
const { requireSeller } = require('../middleware/roles');

router.get('/', optionalAuth, getListings);
router.get('/seller/my-listings', protect, requireSeller, getMyListings);
router.get('/:id', optionalAuth, getListingById);
router.post('/', protect, requireSeller, createListing);
router.post('/:id/mark-sold-request-rating', protect, markSoldAndRequestRating);
router.put('/:id', protect, requireSeller, updateListing);
router.delete('/:id', protect, requireSeller, deleteListing);

module.exports = router;
