const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please login.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'safemarket_super_secure_jwt_secret_key_2026_ph_security');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (user.passwordChangedAt && decoded.iat <= Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      return res.status(401).json({
        success: false,
        message: 'Your password has changed. Please login again.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by an administrator for safety violations.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Session invalid or expired. Please login again.'
    });
  }
};

// Optional auth: attaches req.user if token is present, continues otherwise
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'safemarket_super_secure_jwt_secret_key_2026_ph_security');
      const user = await User.findById(decoded.id).select('-password');
      if (user && (!user.passwordChangedAt || decoded.iat > Math.floor(user.passwordChangedAt.getTime() / 1000))) {
        req.user = user;
      }
    } catch (e) {
      // Ignore token failure for optional
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
