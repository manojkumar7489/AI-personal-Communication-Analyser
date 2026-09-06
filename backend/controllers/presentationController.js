const CommunicationSession = require('../models/CommunicationSession');
const ai = require('../config/gemini');
const { cleanAndParseJSON } = require('../utils/jsonParser');
const { recordSessionProgress, awardUserXP } = require('../services/progressService');
const { XP_REWARDS } = require('../utils/constants');

/**
 * @desc    Start presentation practice session
 * @route   POST /api/presentation/start
 * @access  Private
 */
const startPresentation = async (req, res, next) => {
  try {
    const { topic = 'My Tech Project Architecture', presentationType = 'technical_pitch' } = req.body;

    const session = await CommunicationSession.create({
      userId: req.user._id,
      sessionType: 'presentation',
      contextType: 'presentation',
      status: 'in_progress'
    });

    return res.status(201).json({
      success: true,
      sessionId: session._id,
      topic,
      presentationType,
      instructions: 'Deliver your complete presentation or pitch transcript. Aim for an opening hook, clear problem formulation, 2-3 core solution pillars, transitions, and a clear takeaway conclusion.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Evaluate complete presentation transcript for flow, transitions & structure
 * @route   POST /api/presentation/evaluate
 * @access  Private
 */
const evaluatePresentation = async (req, res, next) => {
  try {
    const { sessionId, speechText, presentationType = 'technical_pitch', durationSeconds = 180 } = req.body;

    if (!speechText || speechText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Presentation speech transcript cannot be empty.'
      });
    }

    const wordCount = speechText.trim().split(/\s+/).length;

    const prompt = `PRESENTATION SPEECH TRANSCRIPT TO EVALUATE:
Type: ${presentationType}
Word Count: ${wordCount}
Estimated Spoken Duration: ${durationSeconds} seconds

TRANSCRIPT:
"""
${speechText}
"""

Evaluate this presentation against professional public speaking & pitch standards.
Analyze:
1. Hook & Introduction (Did it grab attention in the first 20 seconds?)
2. Problem Statement (Was the pain point explicit?)
3. Solution & Evidence (Were the points supported by concrete facts/examples?)
4. Transitions (Did the speaker guide listeners smoothly between topics?)
5. Call to Action / Conclusion (Was the final thought memorable?)

Respond ONLY with a valid JSON object matching this schema:
{
  "presentationScore": <number 0-100>,
  "hookEvaluation": { "score": <number 0-100>, "feedback": "<1-2 sentences on opening>" },
  "transitionsEvaluation": { "score": <number 0-100>, "feedback": "<1-2 sentences on transitions>" },
  "conclusionEvaluation": { "score": <number 0-100>, "feedback": "<1-2 sentences on closing>" },
  "strengths": [<string>, <string>],
  "areasToImprove": [<string>, <string>],
  "recommendedOutline": "<3-bullet refined blueprint for delivering this presentation more impactfully>"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const fallbackEvaluation = {
      presentationScore: 74,
      hookEvaluation: { score: 72, feedback: 'Clear topic introduction, though starting with a provocative question or metric would heighten audience engagement.' },
      transitionsEvaluation: { score: 70, feedback: 'Used basic connectives; try signposting statements like "Now that we have covered X, let us examine Y."' },
      conclusionEvaluation: { score: 75, feedback: 'Good closing summary of the main points.' },
      strengths: ['Logical sequence of technical ideas', 'Good pacing and clarity'],
      areasToImprove: ['Make the opening problem statement punchier', 'Incorporate verbal roadmaps between sections'],
      recommendedOutline: '1. Hook with the core problem metric\n2. Architecture walkthrough with tradeoffs\n3. Quantified impact and call to action'
    };

    const parsed = cleanAndParseJSON(response.text, fallbackEvaluation);

    // Update CommunicationSession
    if (sessionId) {
      await CommunicationSession.findByIdAndUpdate(sessionId, {
        durationSeconds: Number(durationSeconds),
        wordCount,
        status: 'completed'
      });
    }

    // Record session progress
    await recordSessionProgress({
      userId: req.user._id,
      durationSeconds: Number(durationSeconds),
      metrics: {
        grammar: parsed.presentationScore,
        fluency: parsed.transitionsEvaluation.score,
        vocabulary: parsed.presentationScore,
        clarity: parsed.hookEvaluation.score,
        confidence: parsed.conclusionEvaluation.score,
        structure: parsed.presentationScore
      },
      overallScore: parsed.presentationScore
    });

    const xpResult = await awardUserXP(req.user._id, XP_REWARDS.SESSION_COMPLETION + 20);

    return res.status(200).json({
      success: true,
      evaluation: parsed,
      gamification: xpResult
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startPresentation,
  evaluatePresentation
};