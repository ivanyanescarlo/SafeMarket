// Require Seller Role or activated seller mode
const requireSeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // Admin is not a seller or buyer
  if (req.user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Administrators are platform moderators and cannot create or manage seller listings.'
    });
  }

  const isSeller = 
    req.user.role === 'seller' ||
    (req.user.sellerProfile && req.user.sellerProfile.isSeller === true);

  if (!isSeller) {
    return res.status(403).json({
      success: false,
      message: 'Seller mode required. Please complete the Become a Seller activation process.'
    });
  }

  next();
};

// Require Administrator Role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Administrator privileges required.'
    });
  }
  next();
};

module.exports = { requireSeller, requireAdmin };
