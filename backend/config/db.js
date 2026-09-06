const mongoose = require('mongoose');

const connectDB = async () => {
  const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalis_db';

  try {
    const conn = await mongoose.connect(connUri, {
      autoIndex: true
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Runtime connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost. Attempting reconnection...');
    });

    // Graceful process termination handler
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed through app termination.');
      process.exit(0);
    });

  } catch (error) {
    console.error(`[MongoDB] Initial connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;