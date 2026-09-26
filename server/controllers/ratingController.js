const Rating = require('../models/Rating');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');
const { logActivity } = require('../utils/logger');

/**
 * @route   POST /api/ratings
 * @desc    Submit a rating & feedback for a seller (Requires prior transaction/chat)
 */
exports.createRating = async (req, res) => {
  try {
    const { sellerId, listingId, rating, feedback } = req.body;
    const buyerId = req.user._id;

    if (!sellerId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID and rating (1-5) are required.'
      });
    }

    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators are platform moderators and cannot submit buyer ratings.'
      });
    }

    if (sellerId.toString() === buyerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot rate yourself.'
      });
    }

    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found.'
      });
    }

    // VERIFIED TRANSACTION CHECK: Check if buyer has messaged or transacted with the seller
    const conversation = await Conversation.findOne({
      participants: { $all: [buyerId, sellerId] }
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Verified Transaction Required: You can only rate a seller after messaging them or completing a transaction.'
      });
    }

    // Check if buyer has already reviewed this seller for this listing
    let existingRating;
    if (listingId) {
      existingRating = await Rating.findOne({ sellerId, buyerId, listingId });
    }

    let review;
    if (existingRating) {
      existingRating.rating = Number(rating);
      existingRating.feedback = (feedback || '').trim();
      review = await existingRating.save();
    } else {
      review = await Rating.create({
        sellerId,
        buyerId,
        listingId: listingId || null,
        rating: Number(rating),
        feedback: (feedback || '').trim()
      });
    }

    // Recalculate seller average rating
    const allRatings = await Rating.find({ sellerId });
    const totalScore = allRatings.reduce((sum, r) => sum + r.rating, 0);
    const avg = Number((totalScore / allRatings.length).toFixed(1));

    seller.averageRating = avg;
    seller.ratingCount = allRatings.length;
    await seller.save();

    // Create notification for seller
    await Notification.create({
      recipientId: sellerId,
      senderId: buyerId,
      type: 'rating',
      title: 'New Seller Rating Received',
      message: `${req.user.firstName} gave you a ${rating}-star rating!`,
      link: `/profile/${sellerId}`
    });

    await logActivity({
      userId: buyerId,
      userEmail: req.user.email,
      action: 'SELLER_RATED',
      targetType: 'Rating',
      targetId: review._id,
      details: { sellerId, rating, feedback },
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your rating!',
      review,
      sellerStats: {
        averageRating: seller.averageRating,
        ratingCount: seller.ratingCount
      }
    });
  } catch (error) {
    console.error('createRating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit rating.'
    });
  }
};

/**
 * @route   GET /api/ratings/seller/:sellerId
 * @desc    Get all ratings for a seller
 */
exports.getSellerRatings = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const ratings = await Rating.find({ sellerId })
      .populate('buyerId', 'firstName lastName username profileImage')
      .populate('listingId', 'title')
      .sort({ createdAt: -1 });

    const totalRatings = ratings.length;
    const avgRating = totalRatings > 0 
      ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      averageRating: Number(avgRating),
      ratingCount: totalRatings,
      ratings
    });
  } catch (error) {
    console.error('getSellerRatings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller ratings.'
    });
  }
};
