const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const CommunicationSession = require('../models/CommunicationSession');
const { CONTEXT_TYPES, COMMUNICATION_MODES } = require('../utils/constants');
const { CONTEXT_GUIDELINES } = require('../services/promptTemplates');

// Catalog of all 18 communication context scenarios with metadata
const CONTEXT_CATALOG = [
  {
    type: CONTEXT_TYPES.CASUAL,
    title: 'Casual Conversation',
    category: 'Everyday',
    difficulty: 'Easy',
    description: 'Relaxed everyday interaction. Great for warming up and speaking naturally without pressure.',
    starterPrompt: 'Hey there! How has your week been shaping up? Anything exciting happening?'
  },
  {
    type: CONTEXT_TYPES.TALKING_WITH_FRIEND,
    title: 'Talking With a Friend',
    category: 'Everyday',
    difficulty: 'Easy',
    description: 'Catching up with a close companion. Focus on authentic storytelling, emotion, and humor.',
    starterPrompt: 'Yo! It feels like forever since we caught up properly. What have you been working on lately?'
  },
  {
    type: CONTEXT_TYPES.TALKING_WITH_STRANGER,
    title: 'Talking With a Stranger',
    category: 'Social',
    difficulty: 'Medium',
    description: 'Starting conversations gracefully, polite icebreakers, active listening, and building rapport.',
    starterPrompt: 'Excuse me, hi! I noticed you were reading that tech article. Do you follow software engineering trends?'
  },
  {
    type: CONTEXT_TYPES.COLLEGE_CONVERSATION,
    title: 'College Conversation',
    category: 'Academic',
    difficulty: 'Easy',
    description: 'Campus discussions about classes, professors, study groups, semester projects, and campus life.',
    starterPrompt: 'Hey! Did you manage to finish the assignment for class tomorrow, or are you still debugging that section?'
  },
  {
    type: CONTEXT_TYPES.TEACHER_STUDENT,
    title: 'Teacher / Student Conversation',
    category: 'Academic',
    difficulty: 'Medium',
    description: 'Academic office hours: asking for conceptual clarification respectfully and formulating sharp questions.',
    starterPrompt: 'Good afternoon. Please come in! What specific topic or lecture slide would you like to review today?'
  },
  {
    type: CONTEXT_TYPES.TEAM_DISCUSSION,
    title: 'Team Discussion',
    category: 'Workplace',
    difficulty: 'Medium',
    description: 'Collaborative meetings, building on teammate suggestions, and clarifying project blockers.',
    starterPrompt: 'Thanks for jumping on the call, team. Let\'s address our current sprint roadblock. Who wants to summarize where we stand?'
  },
  {
    type: CONTEXT_TYPES.PROJECT_EXPLANATION,
    title: 'Project Explanation',
    category: 'Technical',
    difficulty: 'Medium',
    description: 'Walk through problem, architecture, tradeoffs, and impact without losing the listener in jargon.',
    starterPrompt: 'I\'d love to hear about what you built. Start with the problem you solved and how you architected it.'
  },
  {
    type: CONTEXT_TYPES.TECHNICAL_DISCUSSION,
    title: 'Technical Discussion',
    category: 'Technical',
    difficulty: 'Hard',
    description: 'Deep dive into APIs, databases, concurrency, microservices, and system architecture tradeoffs.',
    starterPrompt: 'When designing a scalable backend system, how do you decide between relational SQL and document NoSQL databases?'
  },
  {
    type: CONTEXT_TYPES.HR_INTERVIEW,
    title: 'HR Behavioral Interview',
    category: 'Career',
    difficulty: 'Hard',
    description: 'Master behavioral questions using the STAR framework (Situation, Task, Action, Result).',
    starterPrompt: 'Welcome to this interview. Let\'s begin: Tell me about yourself and why you are interested in this position.'
  },
  {
    type: CONTEXT_TYPES.TECHNICAL_INTERVIEW,
    title: 'Technical Communication Interview',
    category: 'Career',
    difficulty: 'Hard',
    description: 'Explain technical concepts clearly, reason aloud through architecture, and demonstrate technical depth.',
    starterPrompt: 'Imagine you are explaining RESTful APIs and statelessness to a junior developer. How would you break it down?'
  },
  {
    type: CONTEXT_TYPES.JOB_INTRODUCTION,
    title: 'Job Introduction (Elevator Pitch)',
    category: 'Career',
    difficulty: 'Medium',
    description: 'Deliver a punchy 30-to-60 second summary of your background, core strengths, and value proposition.',
    starterPrompt: 'You have 45 seconds to introduce yourself at a networking event. Go ahead!'
  },
  {
    type: CONTEXT_TYPES.GROUP_DISCUSSION,
    title: 'Group Discussion',
    category: 'Professional',
    difficulty: 'Hard',
    description: 'Entering discussions politely, articulating viewpoints with data, and reconciling conflicting opinions.',
    starterPrompt: 'The topic for our discussion today is: "Is remote work increasing productivity or hurting teamwork?" Please share your opening view.'
  },
  {
    type: CONTEXT_TYPES.PRESENTATION,
    title: 'Presentation Practice',
    category: 'Public Speaking',
    difficulty: 'Hard',
    description: 'Practice structured delivery: compelling hook, clean transitions, supporting points, and a firm call to action.',
    starterPrompt: 'The floor is yours. State the title of your talk and kick off with your opening hook.'
  },
  {
    type: CONTEXT_TYPES.CLIENT_MEETING,
    title: 'Client Meeting',
    category: 'Workplace',
    difficulty: 'Hard',
    description: 'Consultative communication: discovering client requirements, setting expectations, and addressing concerns.',
    starterPrompt: 'Thank you for scheduling time with us today. Could you walk us through the primary goal you want this project to accomplish?'
  },
  {
    type: CONTEXT_TYPES.OFFICE_COMMUNICATION,
    title: 'Office Communication',
    category: 'Workplace',
    difficulty: 'Medium',
    description: 'Concise, clear, and professional day-to-day workplace exchanges that respect colleagues\' time.',
    starterPrompt: 'Hi, quick question regarding the deadline for the quarterly report: will that be finalized by tomorrow afternoon?'
  },
  {
    type: CONTEXT_TYPES.PUBLIC_SPEAKING,
    title: 'Public Speaking',
    category: 'Public Speaking',
    difficulty: 'Hard',
    description: 'Master pacing, rhetorical emphasis, vivid imagery, and persuasive delivery before an audience.',
    starterPrompt: 'Imagine stepping onto the keynote stage. What central message do you want the audience to remember today?'
  },
  {
    type: CONTEXT_TYPES.PHONE_CONVERSATION,
    title: 'Phone Conversation',
    category: 'Everyday',
    difficulty: 'Easy',
    description: 'Verbal-only clarity, active auditory cues, handling audio delays, and summarizing agreements.',
    starterPrompt: 'Hello! Thanks for returning my call. Do you have five minutes to touch base on our plans?'
  },
  {
    type: CONTEXT_TYPES.PROFESSIONAL_NETWORKING,
    title: 'Professional Networking',
    category: 'Career',
    difficulty: 'Medium',
    description: 'Building meaningful industry relationships, asking insightful questions, and setting up future collaboration.',
    starterPrompt: 'Great to meet you here at the tech symposium! What areas of innovation are you most focused on right now?'
  }
];

/**
 * @desc    Fetch list of all 18 communication scenarios with metadata
 * @route   GET /api/context/list
 * @access  Private
 */
const getContextList = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      count: CONTEXT_CATALOG.length,
      contexts: CONTEXT_CATALOG
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Initialize a practice conversation bound to a specific context
 * @route   POST /api/context/start
 * @access  Private
 */
const startContextSession = async (req, res, next) => {
  try {
    const { contextType } = req.body;

    const matchedConfig = CONTEXT_CATALOG.find((c) => c.type === contextType) || CONTEXT_CATALOG[0];

    // Create tracking session
    const session = await CommunicationSession.create({
      userId: req.user._id,
      sessionType: 'context',
      contextType: matchedConfig.type,
      status: 'in_progress'
    });

    // Create contextual conversation thread
    const conversation = await Conversation.create({
      userId: req.user._id,
      title: `${matchedConfig.title} Practice`,
      mode: COMMUNICATION_MODES.CONTEXT_PRACTICE,
      contextType: matchedConfig.type
    });

    // Insert AI opening kickoff turn
    const initialAiMessage = await Message.create({
      conversationId: conversation._id,
      sender: 'assistant',
      participantName: req.user.aiPersonality === 'coach' ? 'AI Coach' : 'AI Partner',
      text: matchedConfig.starterPrompt
    });

    return res.status(201).json({
      success: true,
      session,
      conversation,
      initialMessage: initialAiMessage,
      contextInfo: matchedConfig
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContextList,
  startContextSession
};