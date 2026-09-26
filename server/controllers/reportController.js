const Report = require('../models/Report');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');
const { logActivity } = require('../utils/logger');

/**
 * @route   POST /api/reports
 * @desc    Submit a report against a suspicious listing
 */
exports.createReport = async (req, res) => {
  try {
    const { listingId, reason, description } = req.body;
    const reporterId = req.user._id;

    if (!listingId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Listing ID and report reason are required.'
      });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.'
      });
    }

    // Prevent reporting own listing
    if (listing.sellerId.toString() === reporterId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report your own listing.'
      });
    }

    const report = await Report.create({
      listingId,
      reporterId,
      reason,
      description: (description || '').trim(),
      status: 'Pending'
    });

    await logActivity({
      userId: reporterId,
      userEmail: req.user.email,
      action: 'LISTING_REPORTED',
      targetType: 'Report',
      targetId: report._id,
      details: {
        listingId,
        listingTitle: listing.title,
        reason,
        description
      },
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted. Our safety team and administrators will review it promptly.',
      report
    });
  } catch (error) {
    console.error('createReport error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit report.'
    });
  }
};

/**
 * @route   GET /api/reports
 * @desc    Get all reports (Admin only)
 */
exports.getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reporterId', 'firstName lastName username email')
      .populate({
        path: 'listingId',
        select: 'title price category riskLevel riskIndicators status images sellerId',
        populate: {
          path: 'sellerId',
          select: 'firstName lastName username email'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reports.'
    });
  }
};

/**
 * @route   PUT /api/reports/:id/status
 * @desc    Update report status and admin notes (Admin only)
 */
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, deactivateListing } = req.body;

    const report = await Report.findById(id).populate('listingId');
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }

    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    // If admin chose to remove or deactivate the reported listing
    if (deactivateListing && report.listingId) {
      const listing = await Listing.findById(report.listingId._id);
      if (listing) {
        listing.status = 'removed';
        listing.removalReason = adminNotes || 'Removed following scam/safety violation report';
        await listing.save();

        // Notify seller of violation
        await Notification.create({
          recipientId: listing.sellerId,
          type: 'violation',
          title: '⚠️ Safety Violation: Listing Deactivated',
          message: `Your listing "${listing.title}" was taken down following safety investigation: ${adminNotes || 'Community standard violation.'}`,
          link: '/seller/listings'
        });
      }
    }

    await report.save();

    // Notify reporter that report was resolved
    await Notification.create({
      recipientId: report.reporterId,
      type: 'report_update',
      title: 'Report Status Updated',
      message: `Your report regarding listing has been updated to "${report.status}". Thank you for helping keep SafeMarket secure!`,
      link: '/profile'
    });

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'REPORT_MODERATED',
      targetType: 'Report',
      targetId: report._id,
      details: { status: report.status, adminNotes, deactivatedListing: !!deactivateListing },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully.',
      report
    });
  } catch (error) {
    console.error('updateReportStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report.'
    });
  }
};
