const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
      socketTimeoutMS: 8000
    });

    const connection = await connectionPromise;

    console.log(
      `[MongoDB] Connected successfully: ${connection.connection.host}`
    );

    return connection;
  } catch (error) {
    connectionPromise = null;
    console.error('[MongoDB] Connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;