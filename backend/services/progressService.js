const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const WeaknessProfile = require('../models/WeaknessProfile');
const { XP_REWARDS } = require('../utils/constants');

/**
 * Updates rolling score metrics, session counters, and timeline chart data
 */
async function recordSessionProgress({ userId, durationSeconds, metrics, overallScore }) {
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const todayStr = new Date().toISOString().split('T')[0];

  const progress = await UserProgress.findOne({ userId });
  if (!progress) return;

  // Update lifetime totals
  const totalSessions = progress.lifetimeSessions + 1;
  progress.lifetimeSessions = totalSessions;
  progress.lifetimeMinutes += durationMinutes;

  // Calculate cumulative moving averages
  const calcNewAvg = (currentAvg, newScore) => {
    return Math.round(((currentAvg * (totalSessions - 1)) + newScore) / totalSessions);
  };

  progress.currentAverageScore = calcNewAvg(progress.currentAverageScore, overallScore);
  progress.skillAverages.grammar = calcNewAvg(progress.skillAverages.grammar, metrics.grammar);
  progress.skillAverages.fluency = calcNewAvg(progress.skillAverages.fluency, metrics.fluency);
  progress.skillAverages.vocabulary = calcNewAvg(progress.skillAverages.vocabulary, metrics.vocabulary);
  progress.skillAverages.clarity = calcNewAvg(progress.skillAverages.clarity, metrics.clarity);
  progress.skillAverages.confidence = calcNewAvg(progress.skillAverages.confidence, metrics.confidence);
  progress.skillAverages.structure = calcNewAvg(progress.skillAverages.structure, metrics.structure);

  // Update daily chart snapshot
  const existingSnapshot = progress.dailySnapshots.find((s) => s.date === todayStr);
  if (existingSnapshot) {
    existingSnapshot.avgOverallScore = Math.round(
      ((existingSnapshot.avgOverallScore * existingSnapshot.sessionsCount) + overallScore) /
      (existingSnapshot.sessionsCount + 1)
    );
    existingSnapshot.minutesPracticed += durationMinutes;
    existingSnapshot.sessionsCount += 1;
  } else {
    progress.dailySnapshots.push({
      date: todayStr,
      avgOverallScore: overallScore,
      minutesPracticed: durationMinutes,
      sessionsCount: 1
    });
  }

  // Keep snapshots to maximum 90 days for clean chart performance
  if (progress.dailySnapshots.length > 90) {
    progress.dailySnapshots.shift();
  }

  await progress.save();
}

/**
 * Updates WeaknessProfile with detected fillers and structural habits
 */
async function updateWeaknessProfile({ userId, detectedFillers = [], structuralHabit = 'none', mistakes = [] }) {
  const profile = await WeaknessProfile.findOne({ userId });
  if (!profile) return;

  // 1. Update filler word tallies
  for (const item of detectedFillers) {
    const wordLower = item.word.toLowerCase().trim();
    const existing = profile.fillerWords.find((f) => f.word === wordLower);
    if (existing) {
      existing.count += item.count || 1;
      existing.lastObserved = new Date();
    } else {
      profile.fillerWords.push({
        word: wordLower,
        count: item.count || 1,
        lastObserved: new Date()
      });
    }
  }

  // 2. Update structural habit
  if (structuralHabit && structuralHabit !== 'none') {
    const existingHabit = profile.structuralHabits.find((h) => h.habitKey === structuralHabit);
    if (existingHabit) {
      existingHabit.frequency += 1;
      existingHabit.resolved = false;
    } else {
      profile.structuralHabits.push({
        habitKey: structuralHabit,
        frequency: 1,
        resolved: false
      });
    }
  }

  // 3. Compile top active intervention rules for future AI prompting
  const newRules = [];

  // Top 2 most frequent fillers with count >= 3
  const topFillers = [...profile.fillerWords]
    .filter((f) => f.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);

  if (topFillers.length > 0) {
    const words = topFillers.map((f) => `"${f.word}"`).join(' and ');
    newRules.push(`Frequently leans on filler words: ${words}. If used, advise saying the point without them.`);
  }

  // Unresolved structural habits with frequency >= 2
  const frequentHabits = profile.structuralHabits
    .filter((h) => !h.resolved && h.frequency >= 2)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 2);

  for (const h of frequentHabits) {
    if (h.habitKey === 'jumping_ideas') {
      newRules.push('Explanations tend to jump between ideas. Coach to maintain a linear sequence.');
    } else if (h.habitKey === 'too_short') {
      newRules.push('Answers are often too brief. Prompt for more substance or supporting detail.');
    } else if (h.habitKey === 'rambling') {
      newRules.push('Tends to ramble. Challenge them to explain points in 2-3 concise sentences.');
    } else if (h.habitKey === 'missing_examples') {
      newRules.push('Explains abstractly without examples. Remind them to ground points with a real instance.');
    } else if (h.habitKey === 'abrupt_conclusion') {
      newRules.push('Often ends answers abruptly. Encourage a crisp summary wrap-up.');
    }
  }

  profile.activeInterventionRules = newRules;
  await profile.save();
}

/**
 * Awards XP and checks for level-ups
 */
async function awardUserXP(userId, xpGained) {
  const user = await User.findById(userId);
  if (!user) return { currentXP: 0, level: 1, leveledUp: false };

  user.gamification.xp += xpGained;
  const newLevel = Math.floor(user.gamification.xp / 500) + 1;
  const leveledUp = newLevel > user.gamification.level;

  user.gamification.level = newLevel;
  await user.save();

  return {
    currentXP: user.gamification.xp,
    level: user.gamification.level,
    leveledUp
  };
}

module.exports = {
  recordSessionProgress,
  updateWeaknessProfile,
  awardUserXP
};