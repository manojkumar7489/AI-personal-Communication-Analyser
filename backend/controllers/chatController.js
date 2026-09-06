const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const WeaknessProfile = require('../models/WeaknessProfile');
const User = require('../models/User');
const { generateChatResponse } = require('../services/geminiChatService');
const { COMMUNICATION_MODES, CONTEXT_TYPES, XP_REWARDS } = require('../utils/constants');

/**
 * @desc    Start or retrieve a new conversation thread
 * @route   POST /api/chat/conversation
 * @access  Private
 */
const createConversation = async (req, res, next) => {
  try {
    const { mode, contextType, title } = req.body;

    const conversation = await Conversation.create({
      userId: req.user._id,
      mode: mode || COMMUNICATION_MODES.FRIEND_CHAT,
      contextType: contextType || CONTEXT_TYPES.CASUAL,
      title: title ? title.trim() : 'Casual Conversation'
    });

    // Provide initial friendly greeting turn
    const greetingText = mode === COMMUNICATION_MODES.FRIEND_CHAT
      ? `Hey ${req.user.name.split(' ')[0]}! What's on your mind today? Whether it's college, tech, projects, or just random thoughts—I'm all ears.`
      : `Welcome! We are in ${contextType || 'practice'} mode. What would you like to discuss or present?`;

    const initialAiMessage = await Message.create({
      conversationId: conversation._id,
      sender: 'assistant',
      participantName: req.user.aiPersonality === 'coach' ? 'AI Coach' : 'AI Friend',
      text: greetingText
    });

    return res.status(201).json({
      success: true,
      conversation,
      messages: [initialAiMessage]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user conversations list
 * @route   GET /api/chat/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    const { mode, limit = 20 } = req.query;

    const query = { userId: req.user._id, isActive: true };
    if (mode) {
      query.mode = mode;
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete message history for a conversation
 * @route   GET /api/chat/conversation/:id
 * @access  Private
 */
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message, generate conversational reply with coach memory & award turn XP
 * @route   POST /api/chat/message
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, text, speechDurationSec = 0 } = req.body;

    // Verify conversation ownership
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation session not found.'
      });
    }

    // 1. Save User's utterance
    const userMessage = await Message.create({
      conversationId: conversation._id,
      sender: 'user',
      participantName: req.user.name,
      text: text.trim(),
      speechDurationSec: Number(speechDurationSec) || 0
    });

    // 2. Fetch past conversation turns for context
    const pastMessages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(14);

    const historyForAi = pastMessages.map((msg) => ({
      sender: msg.sender,
      text: msg.text
    }));

    // 3. Fetch User's persistent weakness profile
    const weaknessProfile = await WeaknessProfile.findOne({ userId: req.user._id });
    const weaknessRules = weaknessProfile ? weaknessProfile.activeInterventionRules : [];

    // 4. Generate AI response via Gemini
    const aiText = await generateChatResponse({
      userMessage: text.trim(),
      history: historyForAi,
      personality: req.user.aiPersonality || 'friend',
      contextType: conversation.contextType || 'casual',
      weaknessRules: weaknessRules,
      userProficiency: req.user.targetProficiency || 'intermediate'
    });

    // 5. Save AI's response message
    const aiMessage = await Message.create({
      conversationId: conversation._id,
      sender: 'assistant',
      participantName: req.user.aiPersonality === 'coach' ? 'AI Coach' : 'AI Friend',
      text: aiText
    });

    // 6. Update conversation state & award user turn XP
    conversation.totalTurns += 1;
    conversation.updatedAt = new Date();

    // Dynamically update conversation title after 2nd turn if still default
    if (conversation.totalTurns === 1 && conversation.title === 'New Conversation') {
      conversation.title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }
    await conversation.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'gamification.xp': XP_REWARDS.CHAT_TURN }
    });

    return res.status(200).json({
      success: true,
      userMessage,
      aiMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete or close a conversation
 * @route   DELETE /api/chat/conversation/:id
 * @access  Private
 */
const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation archived successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  sendMessage,
  deleteConversation
};