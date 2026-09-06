const StorySession = require('../models/StorySession');
const CommunicationSession = require('../models/CommunicationSession');
const { analyzeStorytelling } = require('../services/geminiAnalysisService');
const { recordSessionProgress, awardUserXP } = require('../services/progressService');
const { XP_REWARDS } = require('../utils/constants');

const CURATED_PROMPTS = [
  {
    id: 'college_day',
    title: 'My First Day at College',
    description: 'Describe arriving on campus, your initial emotions, and an unexpected encounter that broke the ice.',
    category: 'Personal Experience'
  },
  {
    id: 'difficult_problem',
    title: 'A Difficult Problem I Solved',
    description: 'Set up the critical roadblock you faced, your step-by-step strategy, and the measurable outcome.',
    category: 'Achievement'
  },
  {
    id: 'unforgettable_journey',
    title: 'An Unforgettable Journey',
    description: 'Take the listener on a trip where plans went sideways and how you adapted to the situation.',
    category: 'Adventure'
  },
  {
    id: 'mistake_learned',
    title: 'A Mistake That Taught Me Something',
    description: 'Talk candidly about an error in judgment, the fallout, and the lasting lesson you carry today.',
    category: 'Personal Growth'
  },
  {
    id: 'project_proud',
    title: 'A Project I Am Proud Of',
    description: 'Explain what inspired the build, the key engineering hurdles, and why the final delivery mattered.',
    category: 'Professional'
  },
  {
    id: 'funny_experience',
    title: 'A Funny Experience',
    description: 'Relate a humorous misunderstanding with timing, punchy dialogue, and self-deprecating wit.',
    category: 'Humor'
  },
  {
    id: 'challenge_overcome',
    title: 'A Challenge in My Life',
    description: 'Share a period of doubt or resistance, the mindset shift required, and how you came through it.',
    category: 'Resilience'
  },
  {
    id: 'future_goal',
    title: 'A Future Goal',
    description: 'Paint a vivid picture of what you want to achieve 5 years from now and why that purpose drives you.',
    category: 'Vision'
  }
];

/**
 * @desc    Get curated storytelling prompts
 * @route   GET /api/story/prompts
 * @access  Private
 */
const getPrompts = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      prompts: CURATED_PROMPTS
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit story transcript, trigger 6-axis narrative evaluation & update progress
 * @route   POST /api/story/submit
 * @access  Private
 */
const submitStory = async (req, res, next) => {
  try {
    const { promptTopic, storyText, parentStoryId, durationSeconds = 90 } = req.body;

    if (!promptTopic || !storyText || storyText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt topic and story text are required.'
      });
    }

    // Determine attempt count
    let attemptNumber = 1;
    if (parentStoryId) {
      const priorStory = await StorySession.findById(parentStoryId);
      if (priorStory) {
        attemptNumber = priorStory.attempt + 1;
      }
    }

    // Call Gemini narrative scoring engine
    const evaluation = await analyzeStorytelling({
      promptTopic,
      storyText: storyText.trim()
    });

    // Save StorySession document
    const story = await StorySession.create({
      userId: req.user._id,
      promptTopic: promptTopic.trim(),
      storyText: storyText.trim(),
      attempt: attemptNumber,
      parentStoryId: parentStoryId || null,
      storyScore: evaluation.storyScore,
      breakdown: evaluation.breakdown,
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      betterStructure: evaluation.betterStructure || ''
    });

    // Also register standard CommunicationSession for unified timeline charts
    await CommunicationSession.create({
      userId: req.user._id,
      sessionType: 'story',
      contextType: 'casual',
      durationSeconds: Number(durationSeconds) || 90,
      wordCount: storyText.trim().split(/\s+/).length,
      status: 'completed',
      attemptNumber
    });

    // Record progress rolling metrics
    await recordSessionProgress({
      userId: req.user._id,
      durationSeconds: Number(durationSeconds) || 90,
      metrics: {
        grammar: evaluation.breakdown.grammar,
        fluency: evaluation.breakdown.fluency,
        vocabulary: evaluation.breakdown.vocabulary,
        clarity: evaluation.breakdown.clarity,
        confidence: evaluation.breakdown.engagement,
        structure: evaluation.breakdown.structure
      },
      overallScore: evaluation.storyScore
    });

    // Award XP
    const xpResult = await awardUserXP(req.user._id, XP_REWARDS.STORY_SUBMISSION);

    return res.status(201).json({
      success: true,
      story,
      gamification: xpResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get past storytelling attempts
 * @route   GET /api/story/history
 * @access  Private
 */
const getStoryHistory = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const stories = await StorySession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: stories.length,
      stories
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPrompts,
  submitStory,
  getStoryHistory
};