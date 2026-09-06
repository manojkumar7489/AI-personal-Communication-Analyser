const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const CommunicationSession = require('../models/CommunicationSession');
const ai = require('../config/gemini');
const { cleanAndParseJSON } = require('../utils/jsonParser');
const { recordSessionProgress, awardUserXP } = require('../services/progressService');
const { COMMUNICATION_MODES, CONTEXT_TYPES, XP_REWARDS } = require('../utils/constants');

const DISCUSSION_TOPICS = [
  {
    topic: 'Is AI augmenting human workers or systematically replacing white-collar jobs?',
    participants: ['Aarav (Data & Analytics)', 'Maya (Skeptic & Labor Advocate)', 'Leo (Tech Founder)']
  },
  {
    topic: 'Should college degrees remain the gold standard for hiring in the software industry?',
    participants: ['Aarav (Academician)', 'Maya (Bootcamp Grad)', 'Leo (Engineering Director)']
  },
  {
    topic: 'Is fully remote work sustainable for junior engineer mentorship and company culture?',
    participants: ['Aarav (People Operations)', 'Maya (Senior IC)', 'Leo (Remote-First Advocate)']
  },
  {
    topic: 'Ethical boundaries of algorithmic social media feeds and screen time regulation.',
    participants: ['Aarav (Behavioral Psychologist)', 'Maya (Parent & Educator)', 'Leo (Product Designer)']
  }
];

/**
 * @desc    Get curated Group Discussion topics
 * @route   GET /api/discussion/topics
 * @access  Private
 */
const getDiscussionTopics = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      topics: DISCUSSION_TOPICS
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Start GD room, generate simulated opening arguments from 2 peers
 * @route   POST /api/discussion/start
 * @access  Private
 */
const startDiscussion = async (req, res, next) => {
  try {
    const { topic } = req.body;
    const selectedTopic = topic || DISCUSSION_TOPICS[0].topic;

    const conversation = await Conversation.create({
      userId: req.user._id,
      title: `GD: ${selectedTopic.slice(0, 30)}...`,
      mode: COMMUNICATION_MODES.DISCUSSION,
      contextType: CONTEXT_TYPES.GROUP_DISCUSSION
    });

    const session = await CommunicationSession.create({
      userId: req.user._id,
      sessionType: 'discussion',
      contextType: CONTEXT_TYPES.GROUP_DISCUSSION,
      status: 'in_progress'
    });

    // Generate two natural opening statements by virtual peers via Gemini
    const systemPrompt = `You are orchestrating a realistic, professional group discussion between two virtual participants:
1. "Aarav" (Analytical, references trends and numbers)
2. "Maya" (Pragmatic, questions assumptions and highlights ground realities)

TOPIC: "${selectedTopic}"

Generate an opening exchange where Aarav sets the scene with an initial viewpoint, and Maya responds with a counterpoint or added perspective.
Leave an open opportunity for a third participant (the human user) to interject.
Respond ONLY with a valid JSON array matching this schema:
[
  { "participant": "Aarav", "text": "<2-3 sentences>" },
  { "participant": "Maya", "text": "<2-3 sentences>" }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate opening discussion statements for topic: ${selectedTopic}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const fallbackTurns = [
      {
        participant: 'Aarav',
        text: `Looking at this topic from a data standpoint, technology adoption has always created net-new industries even while automating older tasks.`
      },
      {
        participant: 'Maya',
        text: `That historical trend holds, Aarav, but the speed of current shifts gives displaced workers far less transition time than prior industrial waves.`
      }
    ];

    const turns = cleanAndParseJSON(response.text, fallbackTurns);

    const savedMessages = [];
    for (const turn of turns) {
      const msg = await Message.create({
        conversationId: conversation._id,
        sender: 'assistant',
        participantName: turn.participant,
        text: turn.text
      });
      savedMessages.push(msg);
    }

    return res.status(201).json({
      success: true,
      topic: selectedTopic,
      sessionId: session._id,
      conversationId: conversation._id,
      initialTurns: savedMessages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit user's contribution to the GD, evaluate participation & generate counter-response
 * @route   POST /api/discussion/turn
 * @access  Private
 */
const submitDiscussionTurn = async (req, res, next) => {
  try {
    const { conversationId, text } = req.body;

    if (!conversationId || !text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'conversationId and contribution text are required.'
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // 1. Save user's statement
    const userMsg = await Message.create({
      conversationId: conversation._id,
      sender: 'user',
      participantName: req.user.name,
      text: text.trim()
    });

    // 2. Load recent debate context
    const recentMessages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(6);

    const transcriptSoFar = recentMessages
      .map((m) => `${m.participantName}: "${m.text}"`)
      .join('\n');

    // 3. Evaluate user turn & generate next peer reaction in a single unified Gemini call
    const prompt = `GROUP DISCUSSION CONTEXT:
${transcriptSoFar}

LATEST USER ENTRY:
${req.user.name}: "${text.trim()}"

YOUR TASKS:
1. Evaluate the user's entry for:
   - Entry Timing & Relevance (did it connect to what Maya or Aarav said?)
   - Assertiveness (was it confident and respectful?)
   - Quality of Argument (was evidence, an example, or a logical deduction provided?)
2. Generate the next logical reaction from "Leo" or "Aarav" that acknowledges the user's point and either supports it or offers a thoughtful counter-question.

Respond ONLY with a valid JSON object matching this schema:
{
  "userEvaluation": {
    "score": <number 0-100>,
    "relevanceScore": <number 0-100>,
    "assertivenessScore": <number 0-100>,
    "feedback": "<2 sentences on how effectively the user entered and articulated their point>"
  },
  "nextPeerResponse": {
    "participant": "<'Leo' | 'Aarav' | 'Maya'>",
    "text": "<2-3 sentences responding directly to the user>"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
        responseMimeType: 'application/json'
      }
    });

    const fallbackResult = {
      userEvaluation: {
        score: 75,
        relevanceScore: 78,
        assertivenessScore: 72,
        feedback: 'Good entry into the discussion. You tied into the previous thread effectively; try including one specific metric or case study next.'
      },
      nextPeerResponse: {
        participant: 'Leo',
        text: `That is an insightful angle. If we consider implementation costs, how would startups manage that balance without slowing execution?`
      }
    };

    const parsed = cleanAndParseJSON(response.text, fallbackResult);

    // Save peer reaction
    const peerMsg = await Message.create({
      conversationId: conversation._id,
      sender: 'assistant',
      participantName: parsed.nextPeerResponse.participant,
      text: parsed.nextPeerResponse.text
    });

    const xpResult = await awardUserXP(req.user._id, XP_REWARDS.CHAT_TURN * 2);

    return res.status(200).json({
      success: true,
      userMessage: userMsg,
      evaluation: parsed.userEvaluation,
      peerResponse: peerMsg,
      gamification: xpResult
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDiscussionTopics,
  startDiscussion,
  submitDiscussionTurn
};