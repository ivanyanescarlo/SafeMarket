const mongoose = require('mongoose');
const seedData = require('../data/seed');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SafeMarket');
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    
    // Auto-seed initial accounts and listings if database is empty
    await seedData(false);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
