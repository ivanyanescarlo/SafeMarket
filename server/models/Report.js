const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      required: true
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      enum: [
        'Scam/Suspicious',
        'Misleading Description',
        'Prohibited Item',
        'Fake/Counterfeit',
        'Inappropriate Content',
        'Other'
      ]
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Reviewed', 'Resolved', 'Dismissed'],
      default: 'Pending'
    },
    adminNotes: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
