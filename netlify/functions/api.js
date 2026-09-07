const dns = require('dns');

// Important for MongoDB Atlas SRV resolution
dns.setServers([
  '8.8.8.8',
  '8.8.4.4'
]);

const serverless = require('serverless-http');

require('dotenv').config();

const app = require('../../backend/app');
const connectDB = require('../../backend/config/db');

const serverlessHandler = serverless(app);

exports.handler = async (event, context) => {
  try {
    await connectDB();

    return await serverlessHandler(event, context);
  } catch (error) {
    console.error('[Netlify Function Error]', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Server initialization failed',
        error: error.message
      })
    };
  }
};