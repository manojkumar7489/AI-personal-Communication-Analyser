const DailyChallenge = require('../models/DailyChallenge');
const WeaknessProfile = require('../models/WeaknessProfile');
const CommunicationSession = require('../models/CommunicationSession');
const ai = require('../config/gemini');
const { cleanAndParseJSON } = require('../utils/jsonParser');
const { recordSessionProgress, updateWeaknessProfile, awardUserXP } = require('../services/progressService');
const { XP_REWARDS, COMMON_FILLERS } = require('../utils/constants');

const SPRINT_TOPICS = [
  'Explain artificial intelligence to a 10-year-old.',
  'Describe your hometown and what makes it distinct.',
  'Why should someone learn computer programming today?',
  'Explain the concept of remote work and its key challenges.',
  'Describe your favorite piece of technology and why it matters.',
  'If you had unlimited funding to start any company, what would it be?',
  'Why is active listening harder than speaking?',
  'Explain the importance of physical fitness for mental performance.',
  'Describe the most interesting book, podcast, or documentary you encountered recently.',
  'What is one habit that changed your daily productivity?'
];

/**
 * @desc    Get a timed speaking sprint prompt
 * @route   GET /api/challenges/prompt
 * @access  Private
 */
const getChallengePrompt = async (req, res, next) => {
  try {
    const { duration = 60 } = req.query;
    const durationSeconds = [30, 60, 120].includes(Number(duration)) ? Number(duration) : 60;
    const randomTopic = SPRINT_TOPICS[Math.floor(Math.random() * SPRINT_TOPICS.length)];

    return res.status(200).json({
      success: true,
      topic: randomTopic,
      durationSeconds
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Evaluate spoken sprint transcript (WPM, filler count, flow)
 * @route   POST /api/challenges/evaluate
 * @access  Private
 */
const evaluateChallenge = async (req, res, next) => {
  try {
    const { topic, durationSeconds = 60, transcript } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Spoken transcript cannot be empty.'
      });
    }

    const words = transcript.trim().split(/\s+/);
    const wordCount = words.length;
    const minutes = Number(durationSeconds) / 60;
    const wpm = Math.round(wordCount / minutes);

    // Count local filler occurrences
    const lowerTranscript = transcript.toLowerCase();
    const detectedFillers = [];
    for (const filler of COMMON_FILLERS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = lowerTranscript.match(regex);
      if (matches && matches.length > 0) {
        detectedFillers.push({ word: filler, count: matches.length });
      }
    }

    // Call Gemini for targeted sprint scoring
    const prompt = `TIMED SPEAKING SPRINT:
Topic: "${topic}"
Duration: ${durationSeconds} seconds
Words Spoken: ${wordCount} (WPM: ${wpm})
Transcript:
"""
${transcript}
"""

Evaluate this timed speaking response.
Normal conversational speaking pace is 120-160 WPM.
Respond with JSON matching this schema:
{
  "overallScore": <number 0-100>,
  "pacingFeedback": "<feedback on their rate of speech and WPM>",
  "clarityScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "strengths": [<string>],
  "areasToImprove": [<string>],
  "structuralHabit": "<'jumping_ideas' | 'abrupt_conclusion' | 'too_short' | 'rambling' | 'none'>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const fallback = {
      overallScore: 72,
      pacingFeedback: `Pace was ${wpm} WPM. Aim for a steady 130-150 WPM rhythm.`,
      clarityScore: 70,
      confidenceScore: 75,
      strengths: ['Addressed the topic directly within the time constraint'],
      areasToImprove: ['Use pauses instead of verbal fillers'],
      structuralHabit: 'none'
    };

    const parsed = cleanAndParseJSON(response.text, fallback);

    // Register session
    await CommunicationSession.create({
      userId: req.user._id,
      sessionType: 'challenge',
      contextType: 'public_speaking',
      durationSeconds: Number(durationSeconds),
      wordCount,
      status: 'completed'
    });

    // Record progress & update weakness profile
    await Promise.all([
      recordSessionProgress({
        userId: req.user._id,
        durationSeconds: Number(durationSeconds),
        metrics: {
          grammar: parsed.overallScore,
          fluency: parsed.clarityScore,
          vocabulary: parsed.overallScore,
          clarity: parsed.clarityScore,
          confidence: parsed.confidenceScore,
          structure: parsed.overallScore
        },
        overallScore: parsed.overallScore
      }),
      updateWeaknessProfile({
        userId: req.user._id,
        detectedFillers,
        structuralHabit: parsed.structuralHabit || 'none'
      })
    ]);

    const xpResult = await awardUserXP(req.user._id, XP_REWARDS.CHALLENGE_COMPLETION);

    return res.status(200).json({
      success: true,
      evaluation: {
        overallScore: parsed.overallScore,
        wpm,
        pacingFeedback: parsed.pacingFeedback,
        clarityScore: parsed.clarityScore,
        confidenceScore: parsed.confidenceScore,
        strengths: parsed.strengths || [],
        areasToImprove: parsed.areasToImprove || [],
        detectedFillers
      },
      gamification: xpResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get or generate today's personalized 5-step daily communication workout
 * @route   GET /api/challenges/daily
 * @access  Private
 */
const getDailyWorkout = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    let workout = await DailyChallenge.findOne({
      userId: req.user._id,
      assignedDate: todayStr
    });

    if (!workout) {
      // Inspect persistent weakness profile to personalize workout
      const profile = await WeaknessProfile.findOne({ userId: req.user._id });
      const frequentFiller = profile && profile.fillerWords.length > 0
        ? profile.fillerWords.sort((a, b) => b.count - a.count)[0].word
        : 'filler_words';

      const tasks = [
        {
          stepNumber: 1,
          title: '5 min - Casual Conversation Warmup',
          moduleType: 'chat',
          durationMinutes: 5,
          targetWeakness: 'general_fluency',
          completed: false
        },
        {
          stepNumber: 2,
          title: '5 min - Storytelling Practice',
          moduleType: 'storytelling',
          durationMinutes: 5,
          targetWeakness: 'narrative_arc',
          completed: false
        },
        {
          stepNumber: 3,
          title: `5 min - Clean Speech Drill (Eliminate "${frequentFiller}")`,
          moduleType: 'challenge',
          durationMinutes: 5,
          targetWeakness: frequentFiller,
          completed: false
        },
        {
          stepNumber: 4,
          title: '5 min - Structured Interview Answer',
          moduleType: 'interview',
          durationMinutes: 5,
          targetWeakness: 'conciseness',
          completed: false
        },
        {
          stepNumber: 5,
          title: '5 min - 60-Second Timed Fluency Sprint',
          moduleType: 'challenge',
          durationMinutes: 5,
          targetWeakness: 'pacing',
          completed: false
        }
      ];

      workout = await DailyChallenge.create({
        userId: req.user._id,
        assignedDate: todayStr,
        tasks,
        isWorkoutCompleted: false,
        xpAwarded: XP_REWARDS.DAILY_WORKOUT_ALL
      });
    }

    return res.status(200).json({
      success: true,
      dailyWorkout: workout
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a daily workout step as completed & award bonus XP if fully finished
 * @route   POST /api/challenges/daily/complete-step
 * @access  Private
 */
const completeWorkoutStep = async (req, res, next) => {
  try {
    const { challengeId, stepNumber } = req.body;

    const workout = await DailyChallenge.findOne({
      _id: challengeId,
      userId: req.user._id
    });

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Daily workout routine not found.'
      });
    }

    const task = workout.tasks.find((t) => t.stepNumber === Number(stepNumber));
    if (!task) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workout step number.'
      });
    }

    let xpGained = 0;
    if (!task.completed) {
      task.completed = true;
      xpGained += XP_REWARDS.DAILY_WORKOUT_STEP;
    }

    const allFinished = workout.tasks.every((t) => t.completed);
    if (allFinished && !workout.isWorkoutCompleted) {
      workout.isWorkoutCompleted = true;
      xpGained += workout.xpAwarded;
    }

    await workout.save();

    let gamification = null;
    if (xpGained > 0) {
      gamification = await awardUserXP(req.user._id, xpGained);
    }

    return res.status(200).json({
      success: true,
      dailyWorkout: workout,
      xpGained,
      gamification
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getChallengePrompt,
  evaluateChallenge,
  getDailyWorkout,
  completeWorkoutStep
};