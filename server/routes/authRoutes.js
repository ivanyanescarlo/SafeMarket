const express = require('express');
const router = express.Router();
const { register, verifyOtp, resendOtp, forgotPassword, resetPassword, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;
