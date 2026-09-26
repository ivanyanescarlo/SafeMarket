const Listing = require('../models/Listing');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { analyzeListingWithGemini } = require('../utils/aiRiskAnalyzer');
const { logActivity } = require('../utils/logger');

/**
 * @route   POST /api/listings
 * @desc    Create a new product listing (Seller only)
 */
exports.createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      condition,
      images,
      brand,
      model,
      itemAge,
      additionalDetails,
      province,
      cityMunicipality
    } = req.body;

    if (!title || !description || price === undefined || !category || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required product details (title, description, price, category, condition).'
      });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid non-negative price.'
      });
    }

    // Determine location: form-specified or fallback to seller's location
    const listingProvince = province || req.user.location?.province || 'Metro Manila (NCR)';
    const listingCity = cityMunicipality || req.user.location?.cityMunicipality || 'Quezon City';

    // Run Gemini AI Listing Risk Analyzer
    const aiAnalysis = await analyzeListingWithGemini({
      title,
      description,
      price: numPrice,
      category,
      condition,
      location: { province: listingProvince, cityMunicipality: listingCity },
      brand,
      model
    });

    const listing = await Listing.create({
      sellerId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      price: numPrice,
      category,
      condition,
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'],
      brand: brand ? brand.trim() : '',
      model: model ? model.trim() : '',
      itemAge: itemAge ? itemAge.trim() : '',
      additionalDetails: additionalDetails ? additionalDetails.trim() : '',
      location: {
        province: listingProvince,
        cityMunicipality: listingCity
      },
      riskLevel: aiAnalysis.riskLevel,
      riskIndicators: aiAnalysis.riskIndicators,
      riskSummary: aiAnalysis.riskSummary,
      recommendation: aiAnalysis.recommendation,
      status: 'active'
    });

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LISTING_CREATED',
      targetType: 'Listing',
      targetId: listing._id,
      details: {
        title: listing.title,
        price: listing.price,
        riskLevel: listing.riskLevel
      },
      ip: req.ip
    });

    // If listing flagged as High Risk, issue safety warning/violation notice to seller
    if (listing.riskLevel === 'High') {
      await Notification.create({
        recipientId: req.user._id,
        type: 'violation',
        title: '⚠️ Listing Risk Warning: High Scam Risk',
        message: `Your listing "${listing.title}" triggered High Risk scam flags (${listing.riskIndicators?.slice(0, 2).join(', ') || 'High risk indicators'}). Please review item pricing and details to maintain trusted status.`,
        link: `/product/${listing._id}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'Listing published successfully!',
      listing
    });
  } catch (error) {
    console.error('createListing error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create listing.'
    });
  }
};

/**
 * @route   GET /api/listings
 * @desc    Get all active listings with multi-filter search
 */
exports.getListings = async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      province,
      cityMunicipality,
      riskLevel,
      sort,
      page = 1,
      limit = 24
    } = req.query;

    const query = { status: 'active' };

    // Search keyword
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { model: searchRegex }
      ];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Condition filter
    if (condition && condition !== 'All') {
      query.condition = condition;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Location filter
    if (province && province !== 'All') {
      query['location.province'] = province;
    }
    if (cityMunicipality && cityMunicipality !== 'All') {
      query['location.cityMunicipality'] = cityMunicipality;
    }

    // Risk level filter
    if (riskLevel && riskLevel !== 'All') {
      query.riskLevel = riskLevel;
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'views') sortOption = { views: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('sellerId', 'firstName lastName username profileImage averageRating ratingCount')
      .sort(sortOption)
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
    console.error('getListings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve listings.'
    });
  }
};

/**
 * @route   GET /api/listings/:id
 * @desc    Get single listing details
 */
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('sellerId', 'firstName lastName username profileImage bio location averageRating ratingCount createdAt role');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found.'
      });
    }

    // Increment view count asynchronously
    listing.views = (listing.views || 0) + 1;
    await listing.save();

    // Also get other listings from this seller
    const otherSellerListings = await Listing.find({
      sellerId: listing.sellerId._id,
      _id: { $ne: listing._id },
      status: 'active'
    }).limit(4);

    res.status(200).json({
      success: true,
      listing,
      otherSellerListings
    });
  } catch (error) {
    console.error('getListingById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing details.'
    });
  }
};

/**
 * @route   GET /api/listings/seller/my-listings
 * @desc    Get all listings of the logged-in seller
 */
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ sellerId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      listings
    });
  } catch (error) {
    console.error('getMyListings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your listings.'
    });
  }
};

/**
 * @route   PUT /api/listings/:id
 * @desc    Update an existing listing
 */
exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.'
      });
    }

    // Role and ownership check
    const isOwner = listing.sellerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this listing.'
      });
    }

    const {
      title,
      description,
      price,
      category,
      condition,
      images,
      brand,
      model,
      itemAge,
      additionalDetails,
      province,
      cityMunicipality,
      status
    } = req.body;

    let contentChanged = false;

    if (title && title !== listing.title) {
      listing.title = title.trim();
      contentChanged = true;
    }
    if (description && description !== listing.description) {
      listing.description = description.trim();
      contentChanged = true;
    }
    if (price !== undefined && Number(price) !== listing.price) {
      listing.price = Number(price);
      contentChanged = true;
    }
    if (category) listing.category = category;
    if (condition) listing.condition = condition;
    if (images) listing.images = images;
    if (brand !== undefined) listing.brand = brand.trim();
    if (model !== undefined) listing.model = model.trim();
    if (itemAge !== undefined) listing.itemAge = itemAge.trim();
    if (additionalDetails !== undefined) listing.additionalDetails = additionalDetails.trim();
    if (status) listing.status = status;

    if (province && cityMunicipality) {
      listing.location = {
        province: province.trim(),
        cityMunicipality: cityMunicipality.trim()
      };
    }

    // If description/title/price changed, re-run Gemini AI risk analysis
    if (contentChanged) {
      const aiAnalysis = await analyzeListingWithGemini({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        condition: listing.condition,
        location: listing.location,
        brand: listing.brand,
        model: listing.model
      });

      listing.riskLevel = aiAnalysis.riskLevel;
      listing.riskIndicators = aiAnalysis.riskIndicators;
      listing.riskSummary = aiAnalysis.riskSummary;
      listing.recommendation = aiAnalysis.recommendation;

      if (listing.riskLevel === 'High') {
        await Notification.create({
          recipientId: req.user._id,
          type: 'violation',
          title: '⚠️ Listing Risk Warning: High Scam Risk',
          message: `Your updated listing "${listing.title}" triggered High Risk scam flags (${listing.riskIndicators?.slice(0, 2).join(', ') || 'High risk indicators'}). Please review item pricing and details to maintain trusted status.`,
          link: `/product/${listing._id}`
        });
      }
    }

    await listing.save();

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LISTING_UPDATED',
      targetType: 'Listing',
      targetId: listing._id,
      details: { title: listing.title, status: listing.status },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Listing updated successfully.',
      listing
    });
  } catch (error) {
    console.error('updateListing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing.'
    });
  }
};

/**
 * @route   DELETE /api/listings/:id
 * @desc    Deactivate or delete a listing
 */
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.'
      });
    }

    const isOwner = listing.sellerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this listing.'
      });
    }

    // Set to inactive or delete
    listing.status = 'inactive';
    await listing.save();

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LISTING_DEACTIVATED',
      targetType: 'Listing',
      targetId: listing._id,
      details: { title: listing.title },
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Listing has been removed/deactivated.'
    });
  } catch (error) {
    console.error('deleteListing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove listing.'
    });
  }
};
