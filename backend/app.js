const express = require('express');
const cors = require('cors');

const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Vocalis Communication AI API'
  });
});

// API Routes
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

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;