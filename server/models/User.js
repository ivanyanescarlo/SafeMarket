const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters']
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true
    },
    location: {
      province: {
        type: String,
        required: [true, 'Province is required'],
        trim: true
      },
      cityMunicipality: {
        type: String,
        required: [true, 'City/Municipality is required'],
        trim: true
      }
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer'
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    },
    profileImage: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: '',
      maxlength: 300
    },
    // OTP verification fields
    isVerified: {
      type: Boolean,
      default: false
    },
    otpCode: {
      type: String,
      default: null
    },
    otpExpiresAt: {
      type: Date,
      default: null
    },
    // Seller activation profile
    sellerProfile: {
      isSeller: {
        type: Boolean,
        default: false
      },
      bio: {
        type: String,
        default: ''
      },
      profileImage: {
        type: String,
        default: ''
      },
      agreementAccepted: {
        type: Boolean,
        default: false
      },
      guidelinesAccepted: {
        type: Boolean,
        default: false
      },
      activatedAt: {
        type: Date,
        default: null
      }
    },
    // Seller rating stats
    averageRating: {
      type: Number,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
