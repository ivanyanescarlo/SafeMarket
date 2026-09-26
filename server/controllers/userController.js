const User = require('../models/User');
const Listing = require('../models/Listing');
const Rating = require('../models/Rating');
const Notification = require('../models/Notification');
const { logActivity } = require('../utils/logger');

/**
 * @route   GET /api/users/:id
 * @desc    Get public user profile (with ratings & listings)
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'firstName lastName username role sellerProfile profileImage bio averageRating ratingCount location createdAt status'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Get active listings if user is a seller
    const listings = await Listing.find({
      sellerId: user._id,
      status: 'active'
    }).sort({ createdAt: -1 });

    // Get seller ratings & reviews
    const ratings = await Rating.find({ sellerId: user._id })
      .populate('buyerId', 'firstName lastName username profileImage')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      user,
      listings,
      ratings
    });
  } catch (error) {
    console.error('getUserProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
};

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, profileImage, mobileNumber, province, cityMunicipality } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (profileImage !== undefined) user.profileImage = profileImage.trim();
    if (mobileNumber) user.mobileNumber = mobileNumber.trim();

    if (province && cityMunicipality) {
      user.location = {
        province: province.trim(),
        cityMunicipality: cityMunicipality.trim()
      };
    }

    // If seller, sync bio/profileImage to sellerProfile
    if (user.sellerProfile && user.sellerProfile.isSeller) {
      if (bio !== undefined) user.sellerProfile.bio = bio.trim();
      if (profileImage !== undefined) user.sellerProfile.profileImage = profileImage.trim();
    }

    await user.save();

    await logActivity({
      userId: user._id,
      userEmail: user.email,
      action: 'USER_PROFILE_UPDATED',
      targetType: 'User',
      targetId: user._id,
      details: { firstName: user.firstName, lastName: user.lastName },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.'
    });
  }
};

/**
 * @route   POST /api/users/become-seller
 * @desc    Activate Seller Mode (Step 4 completion)
 */
exports.becomeSeller = async (req, res) => {
  try {
    const { agreementAccepted, guidelinesAccepted, bio, profileImage } = req.body;

    if (!agreementAccepted) {
      return res.status(400).json({
        success: false,
        message: 'You must accept the SafeMarket Seller Agreement to proceed.'
      });
    }

    if (!guidelinesAccepted) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to all SafeMarket Listing Guidelines to proceed.'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot activate seller mode. Administrator is a dedicated platform moderation role.'
      });
    }

    if (user.sellerProfile && user.sellerProfile.isSeller) {
      return res.status(400).json({
        success: false,
        message: 'Seller Mode is already active on your account.'
      });
    }

    // Update role and seller profile
    user.role = 'seller';
    user.sellerProfile = {
      isSeller: true,
      bio: (bio || user.bio || '').trim(),
      profileImage: (profileImage || user.profileImage || '').trim(),
      agreementAccepted: true,
      guidelinesAccepted: true,
      activatedAt: new Date()
    };

    if (bio && !user.bio) user.bio = bio.trim();
    if (profileImage && !user.profileImage) user.profileImage = profileImage.trim();

    await user.save();

    // Create a celebration notification
    await Notification.create({
      recipientId: user._id,
      type: 'seller_activation',
      title: 'Seller Mode Activated!',
      message: 'Welcome to SafeMarket Sellers! You can now create product listings, manage inventory, and interact with buyers.',
      link: '/seller'
    });

    // Record system activity log
    await logActivity({
      userId: user._id,
      userEmail: user.email,
      action: 'SELLER_MODE_ACTIVATED',
      targetType: 'User',
      targetId: user._id,
      details: { agreementAccepted: true, guidelinesAccepted: true },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Congratulations! Seller Mode has been activated successfully.',
      user
    });
  } catch (error) {
    console.error('becomeSeller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate Seller Mode.'
    });
  }
};
