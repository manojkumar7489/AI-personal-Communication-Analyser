const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const WeaknessProfile = require('../models/WeaknessProfile');
const { generateToken } = require('../utils/tokenHelper');

/**
 * @desc    Register a new user, initialize progress & weakness records
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, nativeLanguage, targetProficiency } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Create User record
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      nativeLanguage: nativeLanguage ? nativeLanguage.trim() : 'English',
      targetProficiency: targetProficiency || 'intermediate'
    });

    // Initialize blank UserProgress profile
    await UserProgress.create({
      userId: user._id,
      lifetimeSessions: 0,
      lifetimeMinutes: 0,
      currentAverageScore: 0,
      skillAverages: {
        grammar: 0,
        fluency: 0,
        vocabulary: 0,
        clarity: 0,
        confidence: 0,
        structure: 0
      },
      dailySnapshots: []
    });

    // Initialize blank WeaknessProfile
    await WeaknessProfile.create({
      userId: user._id,
      fillerWords: [],
      structuralHabits: [],
      grammarIssues: [],
      activeInterventionRules: []
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aiPersonality: user.aiPersonality,
        targetProficiency: user.targetProficiency,
        gamification: user.gamification,
        voicePreferences: user.voicePreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user, recalculate streak, return token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Streak calculation
    const now = new Date();
    const lastActive = user.gamification.lastActiveDate
      ? new Date(user.gamification.lastActiveDate)
      : new Date(0);

    const diffDays = Math.floor(
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
        Date.UTC(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate())) /
        (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      user.gamification.streakCount += 1;
    } else if (diffDays > 1) {
      user.gamification.streakCount = 1;
    } else if (diffDays === 0 && user.gamification.streakCount === 0) {
      user.gamification.streakCount = 1;
    }

    user.gamification.lastActiveDate = now;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aiPersonality: user.aiPersonality,
        targetProficiency: user.targetProficiency,
        gamification: user.gamification,
        voicePreferences: user.voicePreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile and session data
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = req.user;
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aiPersonality: user.aiPersonality,
        nativeLanguage: user.nativeLanguage,
        targetProficiency: user.targetProficiency,
        gamification: user.gamification,
        voicePreferences: user.voicePreferences,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe
};