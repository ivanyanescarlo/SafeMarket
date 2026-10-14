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
    const range = req.query.range || 'week';
    const totalUsers = await User.countDocuments({ isVerified: true, role: { $ne: 'admin' } });
    const totalBuyers = await User.countDocuments({ role: 'buyer', isVerified: true });
    const totalSellers = await User.countDocuments({ role: 'seller', isVerified: true });
    const totalSuspendedUsers = await User.countDocuments({ status: 'suspended', isVerified: true, role: { $ne: 'admin' } });

    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ status: 'active' });
    const highRiskListings = await Listing.countDocuments({ riskLevel: 'High' });
    const mediumRiskListings = await Listing.countDocuments({ riskLevel: 'Medium' });

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'Pending' });

    const recentLogs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);

    const makeTrendSeries = async (selectedRange) => {
      const now = new Date();
      const allListings = await Listing.find({}, 'createdAt');
      const allUsers = await User.find({ isVerified: true }, 'createdAt');
      const firstActivity = [...allListings, ...allUsers].reduce((earliest, item) => {
        const createdAt = new Date(item.createdAt);
        return createdAt < earliest ? createdAt : earliest;
      }, now);
      const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const buckets = [];
      let start;
      let count;
      let increment;

      if (selectedRange === 'day') {
        start = new Date(now);
        start.setMinutes(0, 0, 0);
        start.setHours(start.getHours() - 23);
        count = 24;
        increment = (date) => date.setHours(date.getHours() + 1);
      } else if (selectedRange === 'week') {
        start = startOfDay(now);
        start.setDate(start.getDate() - 6);
        count = 7;
        increment = (date) => date.setDate(date.getDate() + 1);
      } else if (selectedRange === 'month') {
        start = startOfDay(now);
        start.setDate(start.getDate() - 29);
        count = 30;
        increment = (date) => date.setDate(date.getDate() + 1);
      } else if (selectedRange === 'sixMonths') {
        start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        count = 6;
        increment = (date) => date.setMonth(date.getMonth() + 1);
      } else if (selectedRange === 'year') {
        start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        count = 12;
        increment = (date) => date.setMonth(date.getMonth() + 1);
      } else {
        start = new Date(firstActivity.getFullYear(), firstActivity.getMonth(), 1);
        count = Math.max(1, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth() + 1);
        increment = (date) => date.setMonth(date.getMonth() + 1);
      }

      const cursor = new Date(start);
      for (let index = 0; index < count; index += 1) {
        const bucketStart = new Date(cursor);
        const nextStart = new Date(cursor);
        increment(nextStart);
        let label;

        if (selectedRange === 'day') {
          label = bucketStart.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        } else if (selectedRange === 'week') {
          label = bucketStart.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (selectedRange === 'month') {
          label = bucketStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        } else if (selectedRange === 'all' || (selectedRange === 'year' && bucketStart.getFullYear() !== now.getFullYear())) {
          label = bucketStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else {
          label = bucketStart.toLocaleDateString('en-US', { month: 'short' });
        }

        if (selectedRange === 'all' && count > 1 && index === 0) {
          label = firstActivity.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        } else if (selectedRange === 'all' && count > 1 && index === count - 1) {
          label = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        buckets.push({
          start: bucketStart,
          end: nextStart,
          point: { label, day: label, listings: 0, users: 0 }
        });
        increment(cursor);
      }

      const addToBucket = (item, field) => {
        const createdAt = new Date(item.createdAt);
        const bucket = buckets.find((entry) => createdAt >= entry.start && createdAt < entry.end);
        if (bucket) bucket.point[field] += 1;
      };

      allListings.forEach((item) => addToBucket(item, 'listings'));
      allUsers.forEach((item) => addToBucket(item, 'users'));

      return buckets.map(({ point }) => point);
    };

    const trendData = await makeTrendSeries(range);

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
        trendData
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
    const query = { isVerified: true, role: { $ne: 'admin' } };

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
      if (role !== 'admin') {
        query.role = role;
      }
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -sellerProfile.verificationImage')
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
 * @desc    Block or unblock an account
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const { status, reason, days } = body;

    if (Object.prototype.hasOwnProperty.call(body, 'role')) {
      return res.status(400).json({
        success: false,
        message: 'User roles cannot be changed through account moderation.'
      });
    }

    if (!['active', 'suspended', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid account status.'
      });
    }

    const user = await User.findById(id).select('-password -sellerProfile.verificationImage');
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

    user.status = status;
    let suspensionDuration = null;
    let suspensionUnit = null;

    if (status === 'suspended') {
      suspensionDuration = Number(body.duration ?? days ?? 7);
      suspensionUnit = body.durationUnit || 'day';

      if (!Number.isInteger(suspensionDuration) || suspensionDuration <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Suspension duration must be a whole number greater than zero.'
        });
      }

      if (!['day', 'month', 'year'].includes(suspensionUnit)) {
        return res.status(400).json({
          success: false,
          message: 'Choose a valid suspension duration unit.'
        });
      }

      const suspendedUntil = new Date();
      if (suspensionUnit === 'day') {
        suspendedUntil.setDate(suspendedUntil.getDate() + suspensionDuration);
      } else {
        const originalDay = suspendedUntil.getDate();
        suspendedUntil.setDate(1);
        if (suspensionUnit === 'month') {
          suspendedUntil.setMonth(suspendedUntil.getMonth() + suspensionDuration);
        } else {
          suspendedUntil.setFullYear(suspendedUntil.getFullYear() + suspensionDuration);
        }
        const lastDayOfMonth = new Date(
          suspendedUntil.getFullYear(),
          suspendedUntil.getMonth() + 1,
          0
        ).getDate();
        suspendedUntil.setDate(Math.min(originalDay, lastDayOfMonth));
      }
      user.suspendedUntil = suspendedUntil;
    } else {
      user.suspendedUntil = null;
    }

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
        suspensionDuration,
        suspensionUnit,
        reason: reason || 'Admin moderation'
      },
      ip: req.ip,
      url: req.baseUrl + req.path
    });

    // Notify user if status changed
    if (status) {
      const isSuspended = status === 'suspended';
      const isBlocked = status === 'blocked';
      await Notification.create({
        recipientId: user._id,
        type: isSuspended || isBlocked ? 'violation' : 'system',
        title: isBlocked ? '🚫 Account Permanently Blocked' : isSuspended ? '⏳ Account Temporarily Suspended' : 'Account Restored',
        message: isBlocked
          ? `Your account has been permanently blocked by an administrator. Reason: ${reason || 'Administrative safety review.'}`
          : isSuspended
            ? `Your account has been temporarily suspended for ${suspensionDuration} ${suspensionUnit}${suspensionDuration === 1 ? '' : 's'}. Reason: ${reason || 'Administrative safety review.'}`
            : `Your account has been restored and is active again. Reason: ${reason || 'Administrative safety review.'}`,
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

    const listing = await Listing.findById(id).populate(
      'sellerId',
      'firstName lastName username email profileImage'
    );
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.'
      });
    }

    const wasRemoved = listing.status === 'removed';
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
      ip: req.ip,
      url: req.baseUrl + req.path
    });

    if (status === 'removed' && !wasRemoved) {
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
    const { action, targetType, page = 1, limit = 50, before, after } = req.query;
    const query = {};

    if (action && action !== 'All') {
      query.action = action;
    }

    if (targetType && targetType !== 'All') {
      query.targetType = targetType;
    }

    if (before) {
      query.createdAt = {
        ...(query.createdAt || {}),
        $lt: new Date(before)
      };
    }

    if (after) {
      query.createdAt = {
        ...(query.createdAt || {}),
        $gt: new Date(after)
      };
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
