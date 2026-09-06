const InterviewSession = require('../models/InterviewSession');
const CommunicationSession = require('../models/CommunicationSession');
const ai = require('../config/gemini');
const { cleanAndParseJSON } = require('../utils/jsonParser');
const { recordSessionProgress, awardUserXP } = require('../services/progressService');
const { XP_REWARDS } = require('../utils/constants');

const HR_QUESTIONS = [
  { question: 'Tell me about yourself and what motivates your career choices.', category: 'introduction' },
  { question: 'Describe a significant challenge or conflict you faced in a project and how you resolved it.', category: 'behavioral' },
  { question: 'What is your greatest professional strength, and what is one real weakness you are actively improving?', category: 'self_awareness' },
  { question: 'Tell me about a time when you made a mistake at work or college. What happened, and what did you learn?', category: 'accountability' },
  { question: 'Where do you see your technical and communication skills evolving over the next three to five years?', category: 'vision' }
];

const TECHNICAL_QUESTIONS = [
  { question: 'Explain what a RESTful API is and what makes an architecture stateless, as if speaking to a junior developer.', category: 'web_architecture' },
  { question: 'How does authentication work using JSON Web Tokens (JWT), and how do you safeguard sensitive keys?', category: 'security' },
  { question: 'Describe the differences between relational (SQL) and document (NoSQL) databases, and when you would select each.', category: 'databases' },
  { question: 'Explain asynchronous JavaScript, the event loop, and how Promises prevent callback hell.', category: 'core_programming' },
  { question: 'Walk me through the architecture of a technical project you built recently. What were the hardest tradeoffs you made?', category: 'system_design' }
];

/**
 * Evaluates an individual interview answer via Gemini
 */
async function evaluateInterviewAnswer(track, question, answer) {
  const isHR = track === 'hr';

  const systemInstruction = isHR
    ? `You are an elite HR director and behavioral interview evaluator.
Evaluate the candidate's answer based on the STAR framework (Situation, Task, Action, Result), conciseness, authenticity, and confidence.
Respond ONLY with a valid JSON object matching this schema:
{
  "score": <number 0-100>,
  "feedback": "<2-3 constructive sentences on their delivery, structure, and presence>",
  "starEvaluation": {
    "situation": <boolean - did they set up context?>,
    "task": <boolean - was their goal defined?>,
    "action": <boolean - did they explain what THEY specifically did?>,
    "result": <boolean - did they present an outcome/metric?>
  }
}`
    : `You are a Principal Software Architect conducting a technical communication interview.
Evaluate how clearly, accurately, and simply the candidate explains this technical concept. 
Do they avoid empty buzzwords? Is the explanation easy to follow while remaining technically sound?
Respond ONLY with a valid JSON object matching this schema:
{
  "score": <number 0-100>,
  "feedback": "<2-3 constructive sentences focusing on technical clarity, structure, and missing details>",
  "starEvaluation": {
    "situation": true,
    "task": true,
    "action": true,
    "result": true
  }
}`;

  const prompt = `QUESTION: "${question}"\nCANDIDATE ANSWER: "${answer}"\n\nEvaluate this response now. Return JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    const fallback = {
      score: 72,
      feedback: 'Clear response with decent structure. Focus on giving more tangible outcomes and smoother transitions.',
      starEvaluation: { situation: true, task: true, action: true, result: false }
    };

    const parsed = cleanAndParseJSON(response.text, fallback);
    parsed.score = Math.max(0, Math.min(100, Number(parsed.score) || 70));
    return parsed;
  } catch (error) {
    console.error('[Interview Evaluation Error]:', error.message);
    return {
      score: 70,
      feedback: 'Good effort. Strive to articulate your personal actions and outcomes more distinctly.',
      starEvaluation: { situation: true, task: true, action: true, result: false }
    };
  }
}

/**
 * @desc    Start an HR or Technical interview session
 * @route   POST /api/interview/start
 * @access  Private
 */
const startInterview = async (req, res, next) => {
  try {
    const { track = 'hr' } = req.body;
    const selectedTrack = track === 'technical' ? 'technical' : 'hr';
    const questions = selectedTrack === 'technical' ? TECHNICAL_QUESTIONS : HR_QUESTIONS;

    const session = await InterviewSession.create({
      userId: req.user._id,
      track: selectedTrack,
      currentQuestionIndex: 0,
      qnaList: questions.map((q) => ({
        question: q.question,
        category: q.category,
        userAnswer: '',
        score: 0,
        feedback: ''
      })),
      isCompleted: false
    });

    return res.status(201).json({
      success: true,
      interviewSessionId: session._id,
      track: session.track,
      totalQuestions: session.qnaList.length,
      currentQuestionIndex: 0,
      question: session.qnaList[0].question,
      category: session.qnaList[0].category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit an answer to the current interview question and advance
 * @route   POST /api/interview/answer
 * @access  Private
 */
const answerQuestion = async (req, res, next) => {
  try {
    const { interviewSessionId, answerText } = req.body;

    if (!interviewSessionId || !answerText || answerText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'interviewSessionId and answerText are required.'
      });
    }

    const session = await InterviewSession.findOne({
      _id: interviewSessionId,
      userId: req.user._id
    });

    if (!session || session.isCompleted) {
      return res.status(404).json({
        success: false,
        message: 'Active interview session not found or already completed.'
      });
    }

    const currentIndex = session.currentQuestionIndex;
    const currentQnA = session.qnaList[currentIndex];

    // Evaluate answer with Gemini
    const evaluation = await evaluateInterviewAnswer(
      session.track,
      currentQnA.question,
      answerText.trim()
    );

    // Save answer and metrics
    currentQnA.userAnswer = answerText.trim();
    currentQnA.score = evaluation.score;
    currentQnA.feedback = evaluation.feedback;
    currentQnA.starEvaluation = evaluation.starEvaluation;

    const isLastQuestion = currentIndex >= session.qnaList.length - 1;

    if (isLastQuestion) {
      session.isCompleted = true;
      const totalScores = session.qnaList.reduce((acc, curr) => acc + curr.score, 0);
      session.overallInterviewScore = Math.round(totalScores / session.qnaList.length);
      await session.save();

      // Record in universal session history
      await CommunicationSession.create({
        userId: req.user._id,
        sessionType: 'interview',
        contextType: session.track === 'technical' ? 'technical_interview' : 'hr_interview',
        durationSeconds: session.qnaList.length * 60,
        wordCount: session.qnaList.reduce((acc, curr) => acc + curr.userAnswer.split(/\s+/).length, 0),
        status: 'completed'
      });

      // Record rolling progress
      await recordSessionProgress({
        userId: req.user._id,
        durationSeconds: session.qnaList.length * 60,
        metrics: {
          grammar: session.overallInterviewScore,
          fluency: session.overallInterviewScore,
          vocabulary: session.overallInterviewScore,
          clarity: session.overallInterviewScore,
          confidence: session.overallInterviewScore,
          structure: session.overallInterviewScore
        },
        overallScore: session.overallInterviewScore
      });

      const xpResult = await awardUserXP(req.user._id, XP_REWARDS.INTERVIEW_COMPLETION);

      return res.status(200).json({
        success: true,
        isCompleted: true,
        feedback: evaluation.feedback,
        starEvaluation: evaluation.starEvaluation,
        score: evaluation.score,
        overallInterviewScore: session.overallInterviewScore,
        gamification: xpResult
      });
    } else {
      session.currentQuestionIndex += 1;
      await session.save();

      const nextQuestionItem = session.qnaList[session.currentQuestionIndex];

      return res.status(200).json({
        success: true,
        isCompleted: false,
        feedback: evaluation.feedback,
        starEvaluation: evaluation.starEvaluation,
        score: evaluation.score,
        nextQuestionIndex: session.currentQuestionIndex,
        nextQuestion: nextQuestionItem.question,
        category: nextQuestionItem.category
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed transcript and scores for a specific interview
 * @route   GET /api/interview/:id
 * @access  Private
 */
const getInterviewSession = async (req, res, next) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Interview session not found.'
      });
    }

    return res.status(200).json({
      success: true,
      interviewSession: session
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startInterview,
  answerQuestion,
  getInterviewSession
};