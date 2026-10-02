const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Uses Mongoose with robust error handling and event listeners
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/academic_resource_db'
    );

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    console.warn('[Database] Note: Ensure MongoDB is running locally or provide a valid MONGODB_URI in server/.env');
    // In dev environment, we don't necessarily want to kill the process immediately so health checks can still be inspected
  }
};

module.exports = connectDB;
