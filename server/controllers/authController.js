const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/logger');
const { sendOtpEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'safemarket_super_secure_jwt_secret_key_2026_ph_security', {
    expiresIn: '7d'
  });
};

// Generate 6-digit OTP code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Pending OTP verification)
 */
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      password,
      confirmPassword,
      mobileNumber,
      province,
      cityMunicipality
    } = req.body;

    // Validation
    if (!firstName || !lastName || !username || !email || !password || !mobileNumber || !province || !cityMunicipality) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();

    // Check existing email or username
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail && existingEmail.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please log in directly.'
      });
    }

    const existingUsername = await User.findOne({ username: cleanUsername });
    if (existingUsername && existingUsername._id.toString() !== existingEmail?._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please choose another username.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingEmail && !existingEmail.isVerified) {
      // Re-use unverified user account: update details & generate new OTP
      user = existingEmail;
      user.firstName = firstName.trim();
      user.lastName = lastName.trim();
      user.username = cleanUsername;
      user.password = password; // Will be hashed via pre-save hook
      user.mobileNumber = mobileNumber.trim();
      user.location = {
        province: province.trim(),
        cityMunicipality: cityMunicipality.trim()
      };
      user.otpCode = otp;
      user.otpExpiresAt = otpExpires;
      await user.save();
    } else {
      // Create new unverified user
      user = await User.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        password,
        mobileNumber: mobileNumber.trim(),
        location: {
          province: province.trim(),
          cityMunicipality: cityMunicipality.trim()
        },
        role: 'buyer',
        isVerified: false,
        otpCode: otp,
        otpExpiresAt: otpExpires
      });
    }

    // Send OTP via Email (or terminal console fallback)
    await sendOtpEmail(user.email, otp, user.firstName);

    await logActivity({
      userId: user._id,
      userEmail: user.email,
      action: 'REGISTRATION_INITIATED',
      targetType: 'User',
      targetId: user._id,
      details: { username: user.username, city: cityMunicipality, province },
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Account registered! Your 6-digit OTP code has been generated and dispatched.',
      userId: user._id,
      email: user.email,
      mobileNumber: user.mobileNumber,
      otpCode: user.otpCode
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Handle MongoDB duplicate key error (code 11000) with 400 Bad Request
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'username or email';
      return res.status(400).json({
        success: false,
        message: `An account with this ${field} already exists. Please choose a different ${field}.`
      });
    }

    // Handle Mongoose validation errors with 400 Bad Request
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.'
    });
  }
};

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and activate account
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and the 6-digit OTP.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found with this email.'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified. You may proceed to login.'
      });
    }

    // Check expiration
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The OTP has expired. Please click "Resend OTP" to request a new code.'
      });
    }

    // Check code strictly against generated user.otpCode
    const cleanOtp = otp.trim();
    if (user.otpCode !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email inbox or spam folder.'
      });
    }

    // Success: activate user
    user.isVerified = true;
    user.otpCode = null;
    user.otpExpiresAt = null;
    await user.save();

    const token = generateToken(user._id);

    await logActivity({
      userId: user._id,
      userEmail: user.email,
      action: 'OTP_VERIFICATION_SUCCESS',
      targetType: 'User',
      targetId: user._id,
      details: { message: 'Account successfully activated' },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Account successfully verified! Welcome to SafeMarket.',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        location: user.location,
        role: user.role,
        sellerProfile: user.sellerProfile,
        profileImage: user.profileImage,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification.'
    });
  }
};

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend a new 6-digit OTP
 */
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered user found with this email.'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified. Please log in directly.'
      });
    }

    const newOtp = generateOTP();
    user.otpCode = newOtp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP via Email (or terminal console fallback)
    await sendOtpEmail(user.email, newOtp, user.firstName);

    await logActivity({
      userId: user._id,
      userEmail: user.email,
      action: 'OTP_RESENT',
      targetType: 'User',
      targetId: user._id,
      details: {},
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'A new 6-digit verification code has been dispatched.',
      otpCode: newOtp
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code.'
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user & get JWT token
 */
exports.login = async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username/email and password.'
      });
    }

    const cleanLoginId = loginId.toLowerCase().trim();
    // Allow login with either email or username
    const user = await User.findOne({
      $or: [{ email: cleanLoginId }, { username: cleanLoginId }]
    });

    if (!user) {
      await logActivity({
        userEmail: cleanLoginId,
        action: 'LOGIN_FAILED_NOT_FOUND',
        targetType: 'Auth',
        details: { loginId: cleanLoginId },
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await logActivity({
        userId: user._id,
        userEmail: user.email,
        action: 'LOGIN_FAILED_WRONG_PASSWORD',
        targetType: 'Auth',
        targetId: user._id,
        details: { username: user.username },
        ip: req.ip
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please check your credentials.'
      });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator for policy violations.'
      });
    }

    // Check verification status
    if (!user.isVerified) {
      // Re-issue an OTP for them
      const newOtp = generateOTP();
      user.otpCode = newOtp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendOtpEmail(user.email, newOtp, user.firstName);

      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: user.email,
        otpCode: user.otpCode,
        message: 'Your account is pending OTP verification. A verification code has been dispatched.'
      });
    }

    const token = generateToken(user._id);

    await logActivity({
      userId: user._id,
      userEmail: user.email,
      action: 'LOGIN_SUCCESS',
      targetType: 'Auth',
      targetId: user._id,
      details: { role: user.role },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        location: user.location,
        role: user.role,
        sellerProfile: user.sellerProfile,
        profileImage: user.profileImage,
        bio: user.bio,
        averageRating: user.averageRating,
        ratingCount: user.ratingCount,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user session.'
    });
  }
};
