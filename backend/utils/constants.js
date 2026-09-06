module.exports = {
  AI_PERSONALITIES: {
    FRIEND: 'friend',
    COACH: 'coach',
    INTERVIEWER: 'interviewer',
    MENTOR: 'mentor'
  },
  
  COMMUNICATION_MODES: {
    FRIEND_CHAT: 'friend_chat',
    CONTEXT_PRACTICE: 'context_practice',
    SPEAKING_CHALLENGE: 'speaking_challenge',
    INTERVIEW: 'interview',
    STORYTELLING: 'storytelling',
    DISCUSSION: 'discussion',
    PRESENTATION: 'presentation'
  },

  CONTEXT_TYPES: {
    CASUAL: 'casual',
    TALKING_WITH_FRIEND: 'talking_with_friend',
    TALKING_WITH_STRANGER: 'talking_with_stranger',
    COLLEGE_CONVERSATION: 'college_conversation',
    TEACHER_STUDENT: 'teacher_student',
    TEAM_DISCUSSION: 'team_discussion',
    PROJECT_EXPLANATION: 'project_explanation',
    TECHNICAL_DISCUSSION: 'technical_discussion',
    HR_INTERVIEW: 'hr_interview',
    TECHNICAL_INTERVIEW: 'technical_interview',
    JOB_INTRODUCTION: 'job_introduction',
    GROUP_DISCUSSION: 'group_discussion',
    PRESENTATION: 'presentation',
    CLIENT_MEETING: 'client_meeting',
    OFFICE_COMMUNICATION: 'office_communication',
    PUBLIC_SPEAKING: 'public_speaking',
    PHONE_CONVERSATION: 'phone_conversation',
    PROFESSIONAL_NETWORKING: 'professional_networking'
  },

  COMMON_FILLERS: [
    'actually',
    'basically',
    'literally',
    'like',
    'you know',
    'so',
    'i mean',
    'sort of',
    'kind of',
    'uh',
    'um'
  ],

  XP_REWARDS: {
    CHAT_TURN: 5,
    SESSION_COMPLETION: 50,
    RETRY_IMPROVEMENT: 40,
    DAILY_WORKOUT_STEP: 20,
    DAILY_WORKOUT_ALL: 100,
    STORY_SUBMISSION: 60,
    INTERVIEW_COMPLETION: 80,
    CHALLENGE_COMPLETION: 40
  },

  ACHIEVEMENTS_LIST: [
    {
      badgeCode: 'FIRST_CONVERSATION',
      title: 'First Step',
      description: 'Completed your very first conversation with Vocalis AI.',
      icon: 'sparkles'
    },
    {
      badgeCode: 'STREAK_7_DAY',
      title: 'Habit Builder',
      description: 'Practiced consistently for 7 consecutive days.',
      icon: 'flame'
    },
    {
      badgeCode: 'STORYTELLER',
      title: 'Master Narrator',
      description: 'Completed a storytelling session with a structure score over 80.',
      icon: 'book'
    },
    {
      badgeCode: 'INTERVIEW_READY',
      title: 'Interview Ready',
      description: 'Completed both HR and Technical interview simulations.',
      icon: 'briefcase'
    },
    {
      badgeCode: 'FLUENCY_BUILDER',
      title: 'Fluency Champion',
      description: 'Maintained a fluency score above 75 across 5 sessions.',
      icon: 'trending-up'
    },
    {
      badgeCode: 'PRACTICE_100_MIN',
      title: 'Centurion Speaker',
      description: 'Completed 100 total minutes of active speaking practice.',
      icon: 'clock'
    },
    {
      badgeCode: 'CONFIDENCE_BOOSTER',
      title: 'Unstoppable Voice',
      description: 'Improved an answer attempt by at least +15 points in Retry mode.',
      icon: 'award'
    }
  ]
};