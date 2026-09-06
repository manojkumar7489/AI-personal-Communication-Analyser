const User = require('../models/User');
const { AI_PERSONALITIES } = require('../utils/constants');

/**
 * @desc    Get complete user profile and settings
 * @route   GET /api/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.status(200).json({
      success: true,
      profile: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update profile details, target proficiency, and voice preferences
 * @route   PUT /api/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, nativeLanguage, targetProficiency, voicePreferences } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name.trim();
    if (nativeLanguage) user.nativeLanguage = nativeLanguage.trim();
    if (targetProficiency) user.targetProficiency = targetProficiency;
    if (voicePreferences) {
      if (voicePreferences.rate !== undefined) user.voicePreferences.rate = Number(voicePreferences.rate);
      if (voicePreferences.pitch !== undefined) user.voicePreferences.pitch = Number(voicePreferences.pitch);
      if (voicePreferences.autoPlayAudio !== undefined) {
        user.voicePreferences.autoPlayAudio = Boolean(voicePreferences.autoPlayAudio);
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aiPersonality: user.aiPersonality,
        nativeLanguage: user.nativeLanguage,
        targetProficiency: user.targetProficiency,
        voicePreferences: user.voicePreferences,
        gamification: user.gamification
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quick toggle AI personality mode
 * @route   PUT /api/profile/personality
 * @access  Private
 */
const setAiPersonality = async (req, res, next) => {
  try {
    const { aiPersonality } = req.body;

    if (!Object.values(AI_PERSONALITIES).includes(aiPersonality)) {
      return res.status(400).json({
        success: false,
        message: `Invalid personality mode. Choose from: ${Object.values(AI_PERSONALITIES).join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { aiPersonality },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: `AI personality updated to ${aiPersonality}.`,
      aiPersonality: user.aiPersonality
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  setAiPersonality
};