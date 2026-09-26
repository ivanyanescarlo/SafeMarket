require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Rating = require('../models/Rating');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SafeMarket');
    console.log('[Seed] Connected to MongoDB database...');

    // Clear existing data
    await User.deleteMany({});
    await Listing.deleteMany({});
    await Rating.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('[Seed] Cleared existing records.');

    // 1. Create Administrator
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      username: 'admin',
      email: 'admin@safemarket.ph',
      password: 'Admin123!',
      mobileNumber: '+639171234567',
      location: {
        province: 'Metro Manila (NCR)',
        cityMunicipality: 'Quezon City'
      },
      role: 'admin',
      status: 'active',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'SafeMarket Safety & Compliance Team'
    });

    // 2. Create Verified Sellers
    const seller1 = await User.create({
      firstName: 'Maria',
      lastName: 'Santos',
      username: 'maria_seller',
      email: 'maria@safemarket.ph',
      password: 'Password123!',
      mobileNumber: '+639182345678',
      location: {
        province: 'Metro Manila (NCR)',
        cityMunicipality: 'Quezon City'
      },
      role: 'seller',
      status: 'active',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      bio: 'Second-hand gadget enthusiast. Honest trader in Quezon City area. Meetup only in safe malls.',
      sellerProfile: {
        isSeller: true,
        bio: 'Second-hand gadget enthusiast. Honest trader in Quezon City area. Meetup only in safe malls.',
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
        agreementAccepted: true,
        guidelinesAccepted: true,
        activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      averageRating: 4.9,
      ratingCount: 8
    });

    const seller2 = await User.create({
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      username: 'juan_tech',
      email: 'juan@safemarket.ph',
      password: 'Password123!',
      mobileNumber: '+639203456789',
      location: {
        province: 'Cebu',
        cityMunicipality: 'Cebu City'
      },
      role: 'seller',
      status: 'active',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      bio: 'Upgrading my photography and computing setup. Honest items, open for visual testing during meetup at Ayala Center Cebu.',
      sellerProfile: {
        isSeller: true,
        bio: 'Upgrading my photography and computing setup. Honest items, open for visual testing during meetup at Ayala Center Cebu.',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        agreementAccepted: true,
        guidelinesAccepted: true,
        activatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      averageRating: 4.8,
      ratingCount: 5
    });

    // 3. Create Verified Buyer
    const buyer = await User.create({
      firstName: 'Carlo',
      lastName: 'Mendoza',
      username: 'carlo_buyer',
      email: 'carlo@safemarket.ph',
      password: 'Password123!',
      mobileNumber: '+639194567890',
      location: {
        province: 'Metro Manila (NCR)',
        cityMunicipality: 'Makati'
      },
      role: 'buyer',
      status: 'active',
      isVerified: true,
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      bio: 'Looking for quality pre-loved tech, furniture, and bicycles in Metro Manila.'
    });

    console.log('[Seed] Created users: admin, maria_seller, juan_tech, carlo_buyer');

    // 4. Create Sample Listings with Realistic SafeMarket Data & Gemini AI Risk Flags
    const listings = [
      {
        sellerId: seller1._id,
        title: 'Sony WH-1000XM4 Noise Canceling Headphones (Midnight Blue)',
        description: 'Selling my pre-loved Sony WH-1000XM4. Purchased 10 months ago, gently used for remote work. Battery health is great (lasts ~28 hours). Comes with original carrying case, 3.5mm cable, and airplane adapter. No dents or scratches. RFS: upgraded to XM5. Meetup at Trinoma or SM North EDSA.',
        price: 8500,
        category: 'Electronics & Appliances',
        condition: 'Like New',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80'
        ],
        brand: 'Sony',
        model: 'WH-1000XM4',
        itemAge: '10 months',
        location: {
          province: 'Metro Manila (NCR)',
          cityMunicipality: 'Quezon City'
        },
        riskLevel: 'Low',
        riskIndicators: [
          'Price is consistent with second-hand market value for this model',
          'Detailed item history and clear reason for selling (RFS) provided',
          'Physical public meetup location proposed'
        ],
        riskSummary: 'Safe peer-to-peer listing with realistic pricing and standard meetup terms.',
        recommendation: 'Test audio clarity and active noise cancellation in person during the meetup before paying.',
        status: 'active',
        views: 42
      },
      {
        sellerId: seller1._id,
        title: 'iPad Air 5th Gen (64GB, Wi-Fi, Space Gray) + Apple Pencil 2',
        description: 'Used primarily for digital note-taking in college. 100% smooth, tempered glass installed since day 1. Includes original box, 20W USB-C charger, and authentic Apple Pencil 2. iCloud signed out and reset. Prefer cash or GCash on personal meetup at Robinsons Galleria or Megamall.',
        price: 24000,
        category: 'Mobile Phones & Gadgets',
        condition: 'Lightly Used',
        images: [
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80'
        ],
        brand: 'Apple',
        model: 'iPad Air 5th Generation',
        itemAge: '1 year',
        location: {
          province: 'Metro Manila (NCR)',
          cityMunicipality: 'Quezon City'
        },
        riskLevel: 'Low',
        riskIndicators: [
          'Fair second-hand bundle price',
          'iCloud logout confirmed',
          'Standard face-to-face transaction at commercial mall'
        ],
        riskSummary: 'Low risk listing with transparent details and sensible market value.',
        recommendation: 'Check serial number in Apple settings during face-to-face meetup to confirm warranty and genuine status.',
        status: 'active',
        views: 78
      },
      {
        sellerId: seller2._id,
        title: 'Fujifilm X-T30 Mirrorless Camera Body + 18-55mm Kit Lens',
        description: 'Fujifilm X-T30 with XF 18-55mm f/2.8-4 R LM OIS lens. Shutter count around 8,500. Kept in a dry cabinet when not in use. Sensor is clean, autofocus is snappy. Includes 2 original NP-W126S batteries, dual charger, and strap. Meetup at Ayala Center Cebu or IT Park.',
        price: 36000,
        category: 'Hobbies, Games & Toys',
        condition: 'Like New',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
        ],
        brand: 'Fujifilm',
        model: 'X-T30',
        itemAge: '2 years',
        location: {
          province: 'Cebu',
          cityMunicipality: 'Cebu City'
        },
        riskLevel: 'Low',
        riskIndicators: [
          'Specific shutter count and storage details provided',
          'Realistic market pricing for Fujifilm camera body and premium kit lens',
          'Legitimate camera accessories and public meetup location'
        ],
        riskSummary: 'Verified second-hand camera listing with complete specifications.',
        recommendation: 'Bring your own SD card to inspect test shots on a laptop or smartphone during meetup.',
        status: 'active',
        views: 55
      },
      {
        sellerId: seller2._id,
        title: 'Keychron K2 V2 Wireless Mechanical Keyboard (Gateron Brown)',
        description: 'Hot-swappable RGB model with Bluetooth and wired type-C. Fully working, clean keycaps, no sticky switches. Complete box and keycap puller included. RFS: switching to split ergonomic layout.',
        price: 2500,
        category: 'Computers & Laptops',
        condition: 'Lightly Used',
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80'
        ],
        brand: 'Keychron',
        model: 'K2 Version 2',
        itemAge: '6 months',
        location: {
          province: 'Cebu',
          cityMunicipality: 'Cebu City'
        },
        riskLevel: 'Low',
        riskIndicators: [
          'Fair price for used mechanical keyboard',
          'Clear specification of switch type and hot-swap feature'
        ],
        riskSummary: 'Clean, standard peer-to-peer accessory listing.',
        recommendation: 'Test Bluetooth pairing with your smartphone upon meetup.',
        status: 'active',
        views: 29
      },
      {
        sellerId: seller1._id,
        title: 'Ergonomic Mesh Office Chair with Lumbar Support and Headrest',
        description: 'Sihoo M57 pre-loved mesh office chair. Breathable high-grade mesh, 3D armrests, sturdy aluminum base. No tears or squeaks. Very comfortable for long work-from-home shifts. For local pickup only in Diliman, Quezon City due to size.',
        price: 4500,
        category: 'Home & Furniture',
        condition: 'Well Used',
        images: [
          'https://images.unsplash.com/photo-1580481077195-c93433550c60?w=800&auto=format&fit=crop&q=80'
        ],
        brand: 'Sihoo',
        model: 'M57',
        itemAge: '1.5 years',
        location: {
          province: 'Metro Manila (NCR)',
          cityMunicipality: 'Quezon City'
        },
        riskLevel: 'Low',
        riskIndicators: [
          'Appropriate second-hand price depreciation for furniture',
          'Honest condition note (Well Used) matching description'
        ],
        riskSummary: 'Standard used furniture listing with local pickup requirement.',
        recommendation: 'Inspect hydraulic lift and tilt mechanism in person upon pickup.',
        status: 'active',
        views: 31
      },
      // Sample Medium Risk Listing (demonstrates urgency and vague details)
      {
        sellerId: seller2._id,
        title: 'RUSH SALE: Nintendo Switch OLED Model + Zelda TOTK Game',
        description: 'Selling my Switch OLED quickly because leaving for overseas work next week! Rush sale price today only. First come first served. Unit has screen protector and complete joycons and dock. Please PM me on Telegram @rush_deal99 for faster response as I am not always online here.',
        price: 8500,
        category: 'Hobbies, Games & Toys',
        condition: 'Like New',
        images: [
          'https://images.unsplash.com/photo-1578303512597-8be9202ff445?w=800&auto=format&fit=crop&q=80'
        ],
        brand: 'Nintendo',
        model: 'Switch OLED',
        location: {
          province: 'Cebu',
          cityMunicipality: 'Cebu City'
        },
        riskLevel: 'Medium',
        riskIndicators: [
          'High urgency language ("RUSH SALE", "today only", "leaving overseas")',
          'Off-platform communication redirect (Telegram username requested)',
          'Price noticeably below typical second-hand OLED bundle value'
        ],
        riskSummary: 'Moderate risk detected due to artificial urgency and external messaging requests.',
        recommendation: 'Never leave SafeMarket messaging. Refuse any advance downpayments and inspect the console in a public mall.',
        status: 'active',
        views: 64
      },
      // Sample High Risk Listing (demonstrates advance deposit scam flag by Gemini AI)
      {
        sellerId: seller1._id,
        title: '⚠️ Brand New iPhone 15 Pro Max 256GB Titanium - Unopened Sealed',
        description: 'Factory sealed iPhone 15 Pro Max, won from corporate raffle. Need emergency cash today for hospital bill so letting it go cheap for only ₱12,000! Many inquiries so strictly require ₱1,000 GCash reservation fee / downpayment to hold the item before we meet up at the mall. Will send copy of ID after reservation payment.',
        price: 12000,
        category: 'Mobile Phones & Gadgets',
        condition: 'Brand New',
        images: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80'
        ],
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        location: {
          province: 'Metro Manila (NCR)',
          cityMunicipality: 'Quezon City'
        },
        riskLevel: 'High',
        riskIndicators: [
          'Unrealistic pricing: ₱12,000 is over 75% below legitimate market value for iPhone 15 Pro Max',
          'Advance payment scam: Seller explicitly demands ₱1,000 GCash reservation deposit before meetup',
          'Classic emotional emergency / urgency tactic ("emergency cash for hospital bill")',
          'Promise of sending ID photos after deposit (frequent stolen ID pretext)'
        ],
        riskSummary: 'High probability of advance-fee scam. Asking for money prior to meeting is a critical warning sign.',
        recommendation: 'DO NOT send money, downpayment, or GCash reservation fees under any circumstances! Report this listing if in doubt.',
        status: 'active',
        views: 112
      },
      {
        sellerId: seller2._id,
        title: 'Trek Marlin 7 Mountain Bike 29er (Medium Frame, Matte Nautical)',
        description: 'Selling my Trek Marlin 7. Upgraded Shimano Deore 1x10 drivetrain, RockShox Judy fork, Maxxis Ardent tires with plenty of tread left. Regularly tuned at local bike shop. Ideal for weekend trail riding or city commuting. Meetup at Lahug or Cebu Business Park.',
        price: 21500,
        category: 'Sports & Outdoors',
        condition: 'Lightly Used',
        images: [
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80'
        ],
        brand: 'Trek',
        model: 'Marlin 7',
        itemAge: '1 year',
        location: {
          province: 'Cebu',
          cityMunicipality: 'Cebu City'
        },
        riskLevel: 'Low',
        riskIndicators: [
          'Realistic price for branded used mountain bike with component upgrades',
          'Technical specifications accurate and consistent'
        ],
        riskSummary: 'Low risk listing with detailed bike specifications.',
        recommendation: 'Test ride the bicycle, inspect gear shifting, and examine the frame for cracks before completing payment.',
        status: 'active',
        views: 47
      }
    ];

    const createdListings = await Listing.insertMany(listings);
    console.log(`[Seed] Created ${createdListings.length} product listings with Gemini AI Risk Analysis.`);

    // 5. Create Sample Ratings
    await Rating.create({
      sellerId: seller1._id,
      buyerId: buyer._id,
      listingId: createdListings[0]._id,
      rating: 5,
      feedback: 'Very smooth transaction! Maria was punctual and let me test the Sony headphones thoroughly at Trinoma. Highly recommended seller!'
    });

    await Rating.create({
      sellerId: seller2._id,
      buyerId: buyer._id,
      listingId: createdListings[2]._id,
      rating: 5,
      feedback: 'Excellent Fujifilm camera as described. Seller was very accommodating and honest about shutter count.'
    });
    console.log('[Seed] Created sample ratings & reviews.');

    // 6. Create Initial Activity Logs
    await ActivityLog.create([
      {
        userId: admin._id,
        userEmail: admin.email,
        action: 'SYSTEM_INITIALIZATION',
        targetType: 'System',
        details: { message: 'SafeMarket database seeded and scam prevention rules initialized' }
      },
      {
        userId: seller1._id,
        userEmail: seller1.email,
        action: 'SELLER_MODE_ACTIVATED',
        targetType: 'User',
        targetId: seller1._id,
        details: { agreementsAccepted: true }
      },
      {
        userId: seller1._id,
        userEmail: seller1.email,
        action: 'LISTING_CREATED',
        targetType: 'Listing',
        targetId: createdListings[0]._id,
        details: { title: createdListings[0].title, riskLevel: 'Low' }
      },
      {
        userId: seller1._id,
        userEmail: seller1.email,
        action: 'LISTING_CREATED',
        targetType: 'Listing',
        targetId: createdListings[6]._id,
        details: { title: createdListings[6].title, riskLevel: 'High', flag: 'Advance deposit request' }
      }
    ]);
    console.log('[Seed] Created sample activity logs.');

    console.log('\n======================================================');
    console.log('✅ SafeMarket Seed Data Complete!');
    console.log('Admin Account: admin@safemarket.ph / Admin123!');
    console.log('Seller Account: maria@safemarket.ph / Password123!');
    console.log('Buyer Account: carlo@safemarket.ph / Password123!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
