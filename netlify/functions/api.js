const serverless = require('serverless-http');

require('dotenv').config();

const app = require('../../backend/app');
const connectDB = require('../../backend/config/db');

const serverlessHandler = serverless(app);

exports.handler = async (event, context) => {
  try {

    // Allow health check without MongoDB
    if (
      event.path === '/api/health' ||
      event.path.endsWith('/api/health')
    ) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'healthy',
          service: 'Vocalis Communication AI API',
          mongodb: 'not checked'
        })
      };
    }

    console.log('[Function] Connecting to MongoDB...');

    await connectDB();

    console.log('[Function] MongoDB connected');

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