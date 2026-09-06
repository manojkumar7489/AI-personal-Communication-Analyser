const path = require('path');
const express = require('express');
const cors = require('cors');
const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);


require('dotenv').config();

const connectDB = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.use('/css', express.static(path.join(frontendPath, 'css')));
app.use('/js', express.static(path.join(frontendPath, 'js')));
app.use('/pages', express.static(path.join(frontendPath, 'pages')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Vocalis Communication AI API'
  });
});

// Mount modular API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/analysis', require('./routes/analysisRoutes'));
app.use('/api/context', require('./routes/contextRoutes'));
app.use('/api/story', require('./routes/storyRoutes'));
app.use('/api/challenges', require('./routes/challengeRoutes'));
app.use('/api/interview', require('./routes/interviewRoutes'));
app.use('/api/discussion', require('./routes/discussionRoutes'));
app.use('/api/presentation', require('./routes/presentationRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/weakness', require('./routes/weaknessRoutes'));
app.use('/api/vocabulary', require('./routes/vocabularyRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));

// Fallback routing for SPA frontend views
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Central error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  Vocalis Server Running on Port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Frontend: http://localhost:${PORT}`);
  console.log(`=========================================`);
});