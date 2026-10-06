const User = require('../models/User');
const Listing = require('../models/Listing');
const Report = require('../models/Report');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const { logActivity } = require('../utils/logger');

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard metrics and counters
 */
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isVerified: true });
    const totalBuyers = await User.countDocuments({ role: 'buyer', isVerified: true });
    const totalSellers = await User.countDocuments({ role: 'seller', isVerified: true });
    const totalSuspendedUsers = await User.countDocuments({ status: 'suspended', isVerified: true });

    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ status: 'active' });
    const highRiskListings = await Listing.countDocuments({ riskLevel: 'High' });
    const mediumRiskListings = await Listing.countDocuments({ riskLevel: 'Medium' });

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'Pending' });

    const recentLogs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);

    // Compute dynamic weekly activity trend from database
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const allListings = await Listing.find({}, 'createdAt');
    const allUsers = await User.find({ isVerified: true }, 'createdAt');

    const dayCounts = {
      Mon: { day: 'Mon', listings: 0, users: 0 },
      Tue: { day: 'Tue', listings: 0, users: 0 },
      Wed: { day: 'Wed', listings: 0, users: 0 },
      Thu: { day: 'Thu', listings: 0, users: 0 },
      Fri: { day: 'Fri', listings: 0, users: 0 },
      Sat: { day: 'Sat', listings: 0, users: 0 },
      Sun: { day: 'Sun', listings: 0, users: 0 }
    };

    allListings.forEach((item) => {
      const dayName = daysOfWeek[new Date(item.createdAt).getDay()];
      if (dayCounts[dayName]) dayCounts[dayName].listings += 1;
    });

    allUsers.forEach((usr) => {
      const dayName = daysOfWeek[new Date(usr.createdAt).getDay()];
      if (dayCounts[dayName]) dayCounts[dayName].users += 1;
    });

    const weeklyTrend = [
      dayCounts.Mon,
      dayCounts.Tue,
      dayCounts.Wed,
      dayCounts.Thu,
      dayCounts.Fri,
      dayCounts.Sat,
      dayCounts.Sun
    ];

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          buyers: totalBuyers,
          sellers: totalSellers,
          suspended: totalSuspendedUsers
        },
        listings: {
          total: totalListings,
          active: activeListings,
          highRisk: highRiskListings,
          mediumRisk: mediumRiskListings
        },
        reports: {
          total: totalReports,
          pending: pendingReports
        },
        weeklyTrend
      },
      recentLogs
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin statistics.'
    });
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with search and filter
 */
exports.getUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 50 } = req.query;
    const query = { isVerified: true };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users list.'
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Suspend or activate an account / toggle role
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Do not allow suspending oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot alter their own account status.'
      });
    }

    if (status) user.status = status;
    if (role) user.role = role;

    await user.save();

    // Log admin moderation
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ADMIN_USER_MODERATION',
      targetType: 'User',
      targetId: user._id,
      details: {
        affectedUser: user.username,
        newStatus: status,
        newRole: role,
        reason: reason || 'Admin moderation'
      },
      ip: req.ip
    });

    // Notify user if status changed
    if (status) {
      const isSuspended = status === 'suspended';
      await Notification.create({
        recipientId: user._id,
        type: isSuspended ? 'violation' : 'system',
        title: isSuspended ? '⚠️ Account Suspension & Violation Notice' : `Account Status Notice: ${status.toUpperCase()}`,
        message: `Your account status has been updated to "${status}" by an administrator. Reason: ${reason || 'Administrative safety review.'}`,
        link: '/profile'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${user.username} successfully updated.`,
      user
    });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status.'
    });
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user account after email confirmation
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const confirmationEmail = typeof req.body.confirmationEmail === 'string'
      ? req.body.confirmationEmail.toLowerCase().trim()
      : '';

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot delete their own account.'
      });
    }

    if (confirmationEmail !== user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation email does not match this account.'
      });
    }

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ADMIN_USER_DELETED',
      targetType: 'User',
      targetId: user._id,
      details: {
        deletedUsername: user.username,
        deletedEmail: user.email
      },
      ip: req.ip
    });

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: `Account ${user.email} was deleted.`
    });
  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user account.'
    });
  }
};

/**
 * @route   GET /api/admin/listings
 * @desc    Get listings for admin moderation
 */
exports.getListings = async (req, res) => {
  try {
    const { search, status, riskLevel, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (riskLevel && riskLevel !== 'All') {
      query.riskLevel = riskLevel;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('sellerId', 'firstName lastName username email status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      listings
    });
  } catch (error) {
    console.error('admin getListings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin listings.'
    });
  }
};

/**
 * @route   PUT /api/admin/listings/:id/moderate
 * @desc    Moderate listing (remove, restore, or update status)
 */
exports.moderateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, removalReason } = req.body;

    const listing = await Listing.findById(id).populate('sellerId');
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.'
      });
    }

    if (status) listing.status = status;
    if (removalReason !== undefined) listing.removalReason = removalReason;

    await listing.save();

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ADMIN_LISTING_MODERATION',
      targetType: 'Listing',
      targetId: listing._id,
      details: {
        title: listing.title,
        newStatus: status,
        reason: removalReason
      },
      ip: req.ip
    });

    if (status === 'removed') {
      await Notification.create({
        recipientId: listing.sellerId._id,
        type: 'violation',
        title: '⚠️ Listing Removed: Policy Violation',
        message: `Your listing "${listing.title}" has been taken down by an administrator: ${removalReason || 'Violated marketplace scam prevention policies.'}`,
        link: '/seller/listings'
      });
    }

    res.status(200).json({
      success: true,
      message: `Listing status updated to ${status}.`,
      listing
    });
  } catch (error) {
    console.error('moderateListing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate listing.'
    });
  }
};

/**
 * @route   GET /api/admin/ai-monitoring
 * @desc    Get listings analyzed by Gemini API (flagged as High or Medium risk)
 */
exports.getAiMonitoring = async (req, res) => {
  try {
    const { riskLevel = 'High' } = req.query;
    const query = {};

    if (riskLevel && riskLevel !== 'All') {
      query.riskLevel = riskLevel;
    } else {
      query.riskLevel = { $in: ['High', 'Medium'] };
    }

    const flaggedListings = await Listing.find(query)
      .populate('sellerId', 'firstName lastName username email averageRating ratingCount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: flaggedListings.length,
      flaggedListings
    });
  } catch (error) {
    console.error('getAiMonitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI monitoring data.'
    });
  }
};

/**
 * @route   GET /api/admin/logs
 * @desc    Get activity logs
 */
exports.getLogs = async (req, res) => {
  try {
    const { action, targetType, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action && action !== 'All') {
      query.action = action;
    }

    if (targetType && targetType !== 'All') {
      query.targetType = targetType;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('userId', 'firstName lastName username email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      logs
    });
  } catch (error) {
    console.error('getLogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve system activity logs.'
    });
  }
};
