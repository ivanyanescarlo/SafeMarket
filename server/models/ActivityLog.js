const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userEmail: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['User', 'Listing', 'Report', 'Rating', 'Message', 'System', 'Auth'],
      default: 'System'
    },
    targetId: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ip: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
