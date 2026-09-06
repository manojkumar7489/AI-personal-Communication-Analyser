const Goal = require('../models/Goal');
const Achievement = require('../models/Achievement');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const { ACHIEVEMENTS_LIST, XP_REWARDS } = require('../utils/constants');
const { awardUserXP } = require('../services/progressService');

/**
 * @desc    Get user's communication goals
 * @route   GET /api/goals
 * @access  Private
 */
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      goals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new communication goal
 * @route   POST /api/goals
 * @access  Private
 */
const createGoal = async (req, res, next) => {
  try {
    const { targetArea, title, targetMetricScore = 80, deadline } = req.body;

    if (!targetArea || !title) {
      return res.status(400).json({
        success: false,
        message: 'targetArea and title are required.'
      });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      targetArea,
      title: title.trim(),
      targetMetricScore: Number(targetMetricScore) || 80,
      deadline: deadline ? new Date(deadline) : null
    });

    return res.status(201).json({
      success: true,
      goal
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update goal status or current progress score
 * @route   PUT /api/goals/:id
 * @access  Private
 */
const updateGoal = async (req, res, next) => {
  try {
    const { currentScore, isCompleted } = req.body;

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    if (currentScore !== undefined) {
      goal.currentScore = Number(currentScore);
    }

    if (isCompleted !== undefined) {
      goal.isCompleted = Boolean(isCompleted);
      if (goal.isCompleted) {
        goal.completedAt = new Date();
      }
    }

    await goal.save();

    return res.status(200).json({
      success: true,
      goal
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch unlocked achievements and check for new badge unlocks
 * @route   GET /api/goals/achievements
 * @access  Private
 */
const getAchievements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const progress = await UserProgress.findOne({ userId: req.user._id });
    const existingAchievements = await Achievement.find({ userId: req.user._id });
    const unlockedCodes = new Set(existingAchievements.map((a) => a.badgeCode));

    const newlyUnlocked = [];

    // Milestone evaluation logic
    if (progress && progress.lifetimeSessions >= 1 && !unlockedCodes.has('FIRST_CONVERSATION')) {
      newlyUnlocked.push('FIRST_CONVERSATION');
    }
    if (user.gamification.streakCount >= 7 && !unlockedCodes.has('STREAK_7_DAY')) {
      newlyUnlocked.push('STREAK_7_DAY');
    }
    if (progress && progress.lifetimeMinutes >= 100 && !unlockedCodes.has('PRACTICE_100_MIN')) {
      newlyUnlocked.push('PRACTICE_100_MIN');
    }
    if (progress && progress.skillAverages.fluency >= 75 && !unlockedCodes.has('FLUENCY_BUILDER')) {
      newlyUnlocked.push('FLUENCY_BUILDER');
    }

    // Persist newly unlocked badges
    for (const badgeCode of newlyUnlocked) {
      const badgeMeta = ACHIEVEMENTS_LIST.find((a) => a.badgeCode === badgeCode);
      if (badgeMeta) {
        await Achievement.create({
          userId: req.user._id,
          badgeCode: badgeMeta.badgeCode,
          title: badgeMeta.title,
          description: badgeMeta.description,
          icon: badgeMeta.icon
        });
        await awardUserXP(req.user._id, 100);
      }
    }

    const allUserAchievements = await Achievement.find({ userId: req.user._id });

    // Map full catalog with locked/unlocked state
    const mappedCatalog = ACHIEVEMENTS_LIST.map((item) => {
      const earned = allUserAchievements.find((a) => a.badgeCode === item.badgeCode);
      return {
        ...item,
        isUnlocked: Boolean(earned),
        unlockedAt: earned ? earned.unlockedAt : null
      };
    });

    return res.status(200).json({
      success: true,
      totalXP: user.gamification.xp,
      level: user.gamification.level,
      achievements: mappedCatalog
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  getAchievements
};