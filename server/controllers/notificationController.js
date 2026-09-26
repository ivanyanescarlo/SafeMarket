const Notification = require('../models/Notification');

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
