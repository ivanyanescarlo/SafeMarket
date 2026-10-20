const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
      max: [599999, 'Price cannot exceed ₱599,999']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Mobile Phones & Gadgets',
        'Computers & Laptops',
        'Electronics & Appliances',
        'Vehicles & Auto Parts',
        'Home & Furniture',
        'Fashion & Apparel',
        'Hobbies, Games & Toys',
        'Sports & Outdoors',
        'Books & Education',
        'Other Second-Hand'
      ]
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: [
        'Brand New',
        'Like New',
        'Lightly Used',
        'Well Used',
        'Heavily Used'
      ]
    },
    images: {
      type: [String],
      default: []
    },
    brand: {
      type: String,
      default: '',
      trim: true
    },
    model: {
      type: String,
      default: '',
      trim: true
    },
    itemAge: {
      type: String,
      default: '',
      trim: true
    },
    additionalDetails: {
      type: String,
      default: '',
      trim: true
    },
    location: {
      province: {
        type: String,
        required: true
      },
      cityMunicipality: {
        type: String,
        required: true
      }
    },
    // Gemini AI Risk Analyzer Fields
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low'
    },
    riskIndicators: {
      type: [String],
      default: []
    },
    riskSummary: {
      type: String,
      default: ''
    },
    recommendation: {
      type: String,
      default: ''
    },
    productCheck: {
      titleStatus: {
        type: String,
        enum: ['match', 'mismatch', 'uncertain'],
        default: 'uncertain'
      },
      brandStatus: {
        type: String,
        enum: ['match', 'mismatch', 'uncertain', 'not_provided'],
        default: 'not_provided'
      },
      modelStatus: {
        type: String,
        enum: ['match', 'mismatch', 'uncertain', 'not_provided'],
        default: 'not_provided'
      },
      summary: {
        type: String,
        default: ''
      }
    },
    priceCheck: {
      status: {
        type: String,
        enum: ['below_market', 'within_market', 'above_market', 'unable_to_assess'],
        default: 'unable_to_assess'
      },
      riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Unverified'],
        default: 'Unverified'
      },
      lowPhp: {
        type: Number,
        default: null
      },
      highPhp: {
        type: Number,
        default: null
      },
      summary: {
        type: String,
        default: ''
      }
    },
    analysisSourceStatus: {
      type: String,
      enum: ['grounded', 'unavailable'],
      default: 'unavailable'
    },
    analysisSourceMessage: {
      type: String,
      default: ''
    },
    comparisonSources: {
      type: [{
        title: {
          type: String,
          required: true
        },
        url: {
          type: String,
          required: true
        },
        pricePhp: {
          type: Number,
          default: null
        },
        productTitle: {
          type: String,
          default: ''
        },
        condition: {
          type: String,
          default: ''
        }
      }],
      default: []
    },
    comparablePrices: {
      type: [{
        title: {
          type: String,
          required: true
        },
        url: {
          type: String,
          required: true
        },
        pricePhp: {
          type: Number,
          required: true,
          min: 0
        },
        productTitle: {
          type: String,
          default: ''
        },
        condition: {
          type: String,
          default: ''
        }
      }],
      default: []
    },
    analyzedAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'inactive', 'removed'],
      default: 'active'
    },
    soldAt: {
      type: Date,
      default: null
    },
    removalReason: {
      type: String,
      default: ''
    },
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Text index for search
listingSchema.index({ title: 'text', description: 'text', brand: 'text', model: 'text' });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
