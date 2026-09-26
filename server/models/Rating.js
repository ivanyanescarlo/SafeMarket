const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate review by same buyer for the same seller and listing
ratingSchema.index({ sellerId: 1, buyerId: 1, listingId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
