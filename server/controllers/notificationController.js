const Notification = require('../models/Notification');
const Report = require('../models/Report');

const enrichLegacyReportNotification = async (notification, userId) => {
  const statusMatch = notification.message.match(/updated to "([^"]+)"/i);
  if (!statusMatch || !notification.createdAt) return;

  const windowMs = 10 * 60 * 1000;
  const createdAt = new Date(notification.createdAt);
  const reports = await Report.find({
    reporterId: userId,
    status: statusMatch[1],
    reviewedAt: {
      $gte: new Date(createdAt.getTime() - windowMs),
      $lte: new Date(createdAt.getTime() + windowMs)
    }
  }).populate({
    path: 'listingId',
    select: 'title status sellerId',
    populate: {
      path: 'sellerId',
      select: 'firstName lastName username'
    }
  });

  const report = reports
    .filter((candidate) => candidate.listingId)
    .sort((left, right) =>
      Math.abs(left.reviewedAt - createdAt) - Math.abs(right.reviewedAt - createdAt)
    )[0];
  if (!report) return;

  const listingTitle = report.listingId.title || 'Listing details unavailable';
  const seller = report.listingId.sellerId;
  const sellerName = [seller?.firstName, seller?.lastName].filter(Boolean).join(' ') || 'Seller details unavailable';
  const sellerDetails = seller?.username ? `${sellerName} (@${seller.username})` : sellerName;
  const outcome = report.status === 'Dismissed'
    ? 'No violation was found. The listing remains active.'
    : report.status === 'Resolved' && report.listingId.status === 'removed'
    ? 'The report was confirmed. The listing was removed.'
    : `The report status is now ${report.status}.`;
  const reportedAt = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila'
  }).format(report.createdAt);

  notification.reportId = report._id;
  notification.title = `Report Status Updated: ${listingTitle} (Seller: ${sellerDetails})`;
  notification.message = [
    `Item reported: ${listingTitle}`,
    `Seller reported: ${sellerDetails}`,
    `Reason: ${report.reason}`,
    report.description ? `Your details: ${report.description}` : null,
    `Reported on: ${reportedAt}`,
    `Outcome: ${outcome}`,
    report.adminNotes ? `Moderator note: ${report.adminNotes}` : null
  ].filter(Boolean).join('\n');
  notification.link = '/notifications';
  await notification.save();
};

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for logged in user
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({
      recipientId: userId,
      type: { $ne: 'message' }
    })
      .populate('senderId', 'firstName lastName username profileImage')
      .sort({ createdAt: -1 })
      .limit(50);

    const legacyReportNotifications = notifications.filter(
      (notification) => notification.type === 'report_update'
        && !notification.reportId
        && notification.message.includes('regarding listing')
    );
    for (const notification of legacyReportNotifications) {
      try {
        await enrichLegacyReportNotification(notification, userId);
      } catch (enrichmentError) {
        console.error('Failed to enrich legacy report notification:', enrichmentError);
      }
    }

    const unreadCount = await Notification.countDocuments({
      recipientId: userId,
      read: false,
      type: { $ne: 'message' }
    });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.'
    });
  }
};

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipientId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification.'
    });
  }
};

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all user notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, read: false, type: { $ne: 'message' } },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear unread notifications.'
    });
  }
};
