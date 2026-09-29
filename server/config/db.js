const mongoose = require('mongoose');
const dns = require('dns');
const seedData = require('../data/seed');

// Enable fallback public DNS for Windows environment SRV lookup
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Ignore if DNS server override fails
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SafeMarket');
    console.log(`[MongoDB] Connected to Cloud Database: ${conn.connection.host}`);
    
    // Auto-seed initial accounts and listings if database is empty
    await seedData(false);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
