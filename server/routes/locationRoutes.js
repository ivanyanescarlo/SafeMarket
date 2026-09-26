const express = require('express');
const router = express.Router();
const PHILIPPINE_LOCATIONS = require('../data/philippineLocations');

// GET /api/locations - Get all Philippine provinces and cities
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    locations: PHILIPPINE_LOCATIONS
  });
});

module.exports = router;
