const dns = require('dns');

dns.setServers([
  '8.8.8.8',
  '8.8.4.4'
]);

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log('=========================================');
      console.log(`Vocalis Server Running on Port ${PORT}`);
      console.log(
        `Environment: ${process.env.NODE_ENV || 'development'}`
      );
      console.log(`Frontend/API: http://localhost:${PORT}`);
      console.log('=========================================');
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
}

startServer();