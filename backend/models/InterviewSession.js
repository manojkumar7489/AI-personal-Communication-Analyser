const mongoose = require('mongoose');

const starEvaluationSchema = new mongoose.Schema(
  {
    situation: { type: Boolean, default: false },
    task: { type: Boolean, default: false },
    action: { type: Boolean, default: false },
    result: { type: Boolean, default: false },
    feedback: { type: String, trim: true }
  },
  { _id: false }
);

const qnaItemSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'behavioral'
    },
    userAnswer: {
      type: String,
      default: '',
      trim: true
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    feedback: {
      type: String,
      default: '',
      trim: true
    },
    starEvaluation: starEvaluationSchema
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    track: {
      type: String,
      enum: ['hr', 'technical'],
      required: true
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
      min: 0
    },
    qnaList: [qnaItemSchema],
    overallInterviewScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

interviewSessionSchema.index({ userId: 1, track: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);