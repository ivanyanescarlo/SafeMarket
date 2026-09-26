const express = require('express');
const router = express.Router();
const { getUserProfile, updateProfile, becomeSeller } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/:id', getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/become-seller', protect, becomeSeller);

module.exports = router;
