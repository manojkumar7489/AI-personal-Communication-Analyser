require('dotenv').config();

exports.handler = async (event, context) => {
  try {
    console.log('[Function] Request path:', event.path);

    // Health check should work WITHOUT loading Express or MongoDB
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

    // Load these only for actual API requests
    const serverless = require('serverless-http');
    const app = require('../../backend/app');
    const connectDB = require('../../backend/config/db');

    console.log('[Function] Connecting to MongoDB...');

    await connectDB();

    console.log('[Function] MongoDB connected');

    const serverlessHandler = serverless(app);

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