const CommunicationSession = require('../models/CommunicationSession');
const CommunicationAnalysis = require('../models/CommunicationAnalysis');
const Message = require('../models/Message');
const { analyzeCommunicationSession, compareRetryAttempts } = require('../services/geminiAnalysisService');
const { recordSessionProgress, updateWeaknessProfile, awardUserXP } = require('../services/progressService');
const { XP_REWARDS } = require('../utils/constants');

/**
 * @desc    Finalize a session, aggregate utterances, run Gemini analysis, and save results
 * @route   POST /api/analysis/session
 * @access  Private
 */
const analyzeSession = async (req, res, next) => {
  try {
    const { sessionId, conversationId, transcriptText, durationSeconds = 60 } = req.body;

    let transcript = transcriptText;

    // If no direct transcript provided, aggregate from conversation turns
    if (!transcript && conversationId) {
      const messages = await Message.find({ conversationId, sender: 'user' }).sort({ createdAt: 1 });
      transcript = messages.map((m) => m.text).join('\n');
    }

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No transcript text available for communication analysis.'
      });
    }

    // Locate or initialize session record
    let session;
    if (sessionId) {
      session = await CommunicationSession.findOne({ _id: sessionId, userId: req.user._id });
    }

    if (!session) {
      session = await CommunicationSession.create({
        userId: req.user._id,
        sessionType: 'chat',
        contextType: 'casual',
        durationSeconds: Number(durationSeconds) || 60,
        wordCount: transcript.trim().split(/\s+/).length,
        status: 'completed'
      });
    } else {
      session.status = 'completed';
      session.durationSeconds = Number(durationSeconds) || session.durationSeconds;
      session.wordCount = transcript.trim().split(/\s+/).length;
      await session.save();
    }

    // Call Gemini Diagnostic Engine
    const aiAnalysis = await analyzeCommunicationSession({
      transcript,
      contextType: session.contextType,
      targetRole: req.user.targetProficiency
    });

    // Save CommunicationAnalysis record
    const analysis = await CommunicationAnalysis.create({
      sessionId: session._id,
      userId: req.user._id,
      overallScore: aiAnalysis.overallScore,
      metrics: {
        grammar: aiAnalysis.grammar,
        fluency: aiAnalysis.fluency,
        vocabulary: aiAnalysis.vocabulary,
        clarity: aiAnalysis.clarity,
        confidence: aiAnalysis.confidence,
        structure: aiAnalysis.structure
      },
      strengths: aiAnalysis.strengths || [],
      weaknesses: aiAnalysis.weaknesses || [],
      importantMistakes: aiAnalysis.importantMistakes || [],
      betterApproach: aiAnalysis.betterApproach || '',
      retryRecommended: Boolean(aiAnalysis.retryRecommended),
      nextFocus: aiAnalysis.nextFocus || ''
    });

    session.analysisId = analysis._id;
    await session.save();

    // Update historical progress, weakness profile, and user XP in parallel
    await Promise.all([
      recordSessionProgress({
        userId: req.user._id,
        durationSeconds: session.durationSeconds,
        metrics: analysis.metrics,
        overallScore: analysis.overallScore
      }),
      updateWeaknessProfile({
        userId: req.user._id,
        detectedFillers: aiAnalysis.detectedFillers || [],
        structuralHabit: aiAnalysis.structuralHabitObserved || 'none',
        mistakes: aiAnalysis.importantMistakes || []
      })
    ]);

    const xpResult = await awardUserXP(req.user._id, XP_REWARDS.SESSION_COMPLETION);

    return res.status(200).json({
      success: true,
      analysis,
      session,
      gamification: xpResult
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve existing diagnostic analysis for a session
 * @route   GET /api/analysis/:sessionId
 * @access  Private
 */
const getAnalysisBySession = async (req, res, next) => {
  try {
    const analysis = await CommunicationAnalysis.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'No analysis found for this session.'
      });
    }

    return res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Compare previous attempt vs new attempt and generate delta improvement report
 * @route   POST /api/analysis/retry
 * @access  Private
 */
const compareRetry = async (req, res, next) => {
  try {
    const { originalText, newText, previousScore } = req.body;

    if (!originalText || !newText) {
      return res.status(400).json({
        success: false,
        message: 'Both originalText and newText are required for retry comparison.'
      });
    }

    const deltaResult = await compareRetryAttempts({
      originalText,
      newText,
      previousScore: Number(previousScore) || 65
    });

    // Reward extra XP if the user improved their delivery
    let gamification = null;
    if (deltaResult.scoreDelta > 0) {
      gamification = await awardUserXP(req.user._id, XP_REWARDS.RETRY_IMPROVEMENT);
    }

    return res.status(200).json({
      success: true,
      delta: deltaResult,
      gamification
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeSession,
  getAnalysisBySession,
  compareRetry
};