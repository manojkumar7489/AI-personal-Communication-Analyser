const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  const connUri =
    process.env.MONGODB_URI ||
    'mongodb://localhost:27017/vocalis_db';

  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Reuse an existing connection attempt
  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    connectionPromise = mongoose.connect(connUri, {
      autoIndex: true
    });

    const conn = await connectionPromise;

    console.log(
      `[MongoDB] Connected successfully to host: ${conn.connection.host}`
    );

    mongoose.connection.on('error', (err) => {
      console.error(
        `[MongoDB] Runtime connection error: ${err.message}`
      );
    });

    return conn;
  } catch (error) {
    connectionPromise = null;

    console.error(
      `[MongoDB] Initial connection error: ${error.message}`
    );

    throw error;
  }
};

module.exports = connectDB;