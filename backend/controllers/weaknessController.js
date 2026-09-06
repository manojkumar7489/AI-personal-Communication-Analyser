const WeaknessProfile = require('../models/WeaknessProfile');

/**
 * @desc    Get user's weakness profile & tracked speech patterns
 * @route   GET /api/weakness/profile
 * @access  Private
 */
const getWeaknessProfile = async (req, res, next) => {
  try {
    let profile = await WeaknessProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await WeaknessProfile.create({
        userId: req.user._id,
        fillerWords: [],
        structuralHabits: [],
        grammarIssues: [],
        activeInterventionRules: []
      });
    }

    return res.status(200).json({
      success: true,
      weaknessProfile: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a specific communication habit as consciously addressed/resolved
 * @route   POST /api/weakness/resolve
 * @access  Private
 */
const resolveHabit = async (req, res, next) => {
  try {
    const { habitKey, word } = req.body;
    const profile = await WeaknessProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Weakness profile not found.' });
    }

    if (habitKey) {
      const habit = profile.structuralHabits.find((h) => h.habitKey === habitKey);
      if (habit) habit.resolved = true;
    }

    if (word) {
      profile.fillerWords = profile.fillerWords.filter((f) => f.word !== word.toLowerCase().trim());
    }

    // Refresh active intervention rules
    profile.activeInterventionRules = profile.activeInterventionRules.filter(
      (rule) => !rule.toLowerCase().includes(word ? word.toLowerCase() : habitKey)
    );

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Habit marked as addressed.',
      weaknessProfile: profile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeaknessProfile,
  resolveHabit
};