const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const DailyChallenge = require('../models/DailyChallenge');

/**
 * @desc    Get top-level dashboard metrics (overall score, skill radar, streak, daily workout)
 * @route   GET /api/progress/dashboard
 * @access  Private
 */
const getDashboardMetrics = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let progress = await UserProgress.findOne({ userId: req.user._id });

    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user._id,
        lifetimeSessions: 0,
        lifetimeMinutes: 0,
        currentAverageScore: 0,
        skillAverages: { grammar: 0, fluency: 0, vocabulary: 0, clarity: 0, confidence: 0, structure: 0 },
        dailySnapshots: []
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyWorkout = await DailyChallenge.findOne({
      userId: req.user._id,
      assignedDate: todayStr
    });

    return res.status(200).json({
      success: true,
      dashboard: {
        overallScore: progress.currentAverageScore,
        skillAverages: progress.skillAverages,
        lifetimeSessions: progress.lifetimeSessions,
        lifetimeMinutes: progress.lifetimeMinutes,
        gamification: user.gamification,
        dailyWorkout: dailyWorkout || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed Chart.js time-series data filtered by timeframe
 * @route   GET /api/progress/analytics
 * @access  Private
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { range = '7d' } = req.query;
    const progress = await UserProgress.findOne({ userId: req.user._id });

    if (!progress) {
      return res.status(200).json({
        success: true,
        timeline: [],
        radarSkills: { grammar: 0, fluency: 0, vocabulary: 0, clarity: 0, confidence: 0, structure: 0 }
      });
    }

    let snapshots = [...progress.dailySnapshots];

    // Filter by timeframe
    const now = new Date();
    if (range === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      snapshots = snapshots.filter((s) => s.date >= sevenDaysAgo);
    } else if (range === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      snapshots = snapshots.filter((s) => s.date >= thirtyDaysAgo);
    }

    return res.status(200).json({
      success: true,
      timeline: snapshots,
      radarSkills: progress.skillAverages,
      currentAverageScore: progress.currentAverageScore
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
  getAnalytics
};