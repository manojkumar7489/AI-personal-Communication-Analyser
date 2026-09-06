const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ai = require('../config/gemini');
const { cleanAndParseJSON } = require('../utils/jsonParser');
const { awardUserXP } = require('../services/progressService');
const { XP_REWARDS } = require('../utils/constants');

const DEFAULT_VOCABULARY = [
  {
    word: 'articulate',
    partOfSpeech: 'verb / adjective',
    definition: 'Express an idea or feeling fluently and coherently.',
    contextExample: 'He was able to articulate the system architecture clearly to stakeholders.',
    category: 'Communication'
  },
  {
    word: 'scalability',
    partOfSpeech: 'noun',
    definition: 'The capacity to be changed in size or scale to handle growing demand.',
    contextExample: 'We prioritized modular architecture to ensure backend scalability.',
    category: 'Technical'
  },
  {
    word: 'concur',
    partOfSpeech: 'verb',
    definition: 'Be of the same opinion; agree.',
    contextExample: 'I concur with Maya\'s assessment regarding the timeline risk.',
    category: 'Professional'
  },
  {
    word: 'pragmatic',
    partOfSpeech: 'adjective',
    definition: 'Dealing with things sensibly and realistically based on practical considerations.',
    contextExample: 'We took a pragmatic approach to the deadline by deferring minor features.',
    category: 'Decision Making'
  },
  {
    word: 'nuance',
    partOfSpeech: 'noun',
    definition: 'A subtle distinction or variation in meaning, expression, or tone.',
    contextExample: 'He understood the nuance between constructive feedback and mere criticism.',
    category: 'Communication'
  }
];

/**
 * @desc    Extract contextual vocabulary recommendations based on user's recent discussions
 * @route   GET /api/vocabulary/recommendations
 * @access  Private
 */
const getRecommendations = async (req, res, next) => {
  try {
    // Fetch user's recent messages to identify active topics
    const recentConversations = await Conversation.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(3);

    const convIds = recentConversations.map((c) => c._id);
    const recentMessages = await Message.find({ conversationId: { $in: convIds }, sender: 'user' })
      .sort({ createdAt: -1 })
      .limit(8);

    if (recentMessages.length === 0) {
      return res.status(200).json({
        success: true,
        vocabularyList: DEFAULT_VOCABULARY
      });
    }

    const aggregatedSnippet = recentMessages.map((m) => m.text).join(' ');

    const prompt = `Based on what this communication student has been speaking about:
"""
${aggregatedSnippet.slice(0, 1000)}
"""

Recommend 5 elevated, contextually relevant vocabulary words they can use in future conversations on these themes.
Do not suggest overly obscure or archaic words. Focus on strong professional and conversational utility.
Respond with JSON matching this schema:
[
  {
    "word": "<string>",
    "partOfSpeech": "<noun | verb | adjective | adverb>",
    "definition": "<simple, crisp definition>",
    "contextExample": "<natural example sentence directly relevant to their topics>",
    "category": "<category name>"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });

    const words = cleanAndParseJSON(response.text, DEFAULT_VOCABULARY);

    return res.status(200).json({
      success: true,
      vocabularyList: words
    });
  } catch (error) {
    console.error('[Vocabulary Recommendations Error]:', error.message);
    return res.status(200).json({
      success: true,
      vocabularyList: DEFAULT_VOCABULARY
    });
  }
};

/**
 * @desc    Mark a vocabulary word as practiced and award XP
 * @route   POST /api/vocabulary/mark-practiced
 * @access  Private
 */
const markPracticed = async (req, res, next) => {
  try {
    const { word, contextUsed } = req.body;

    if (!word) {
      return res.status(400).json({ success: false, message: 'Word is required.' });
    }

    const xpResult = await awardUserXP(req.user._id, XP_REWARDS.DAILY_WORKOUT_STEP);

    return res.status(200).json({
      success: true,
      message: `Great job integrating "${word}" into your vocabulary!`,
      gamification: xpResult
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  markPracticed
};