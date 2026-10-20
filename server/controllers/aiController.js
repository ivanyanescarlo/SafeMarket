const { analyzeListingWithGemini } = require('../utils/aiRiskAnalyzer');

/**
 * @route   POST /api/ai/analyze-listing
 * @desc    Analyze listing content for scam and fraud indicators using Gemini API
 */
exports.analyzeListing = async (req, res) => {
  try {
    const { title, description, price, category, condition, location, brand, model } = req.body;

    if (typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a product title and description before analyzing.'
      });
    }

    const analysis = await analyzeListingWithGemini({
      title,
      description,
      price,
      category,
      condition,
      location,
      brand,
      model
    });

    res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('AI analysis controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete AI scam risk analysis.'
    });
  }
};
