const mongoose = require('mongoose');

const mistakeItemSchema = new mongoose.Schema(
  {
    originalText: {
      type: String,
      required: true
    },
    issueType: {
      type: String,
      enum: ['grammar', 'filler', 'ambiguity', 'structure', 'redundancy'],
      default: 'grammar'
    },
    explanation: {
      type: String,
      required: true
    },
    betterAlternative: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const communicationAnalysisSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunicationSession',
      required: true,
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    metrics: {
      grammar: { type: Number, required: true, min: 0, max: 100 },
      fluency: { type: Number, required: true, min: 0, max: 100 },
      vocabulary: { type: Number, required: true, min: 0, max: 100 },
      clarity: { type: Number, required: true, min: 0, max: 100 },
      confidence: { type: Number, required: true, min: 0, max: 100 },
      structure: { type: Number, required: true, min: 0, max: 100 }
    },
    strengths: [
      {
        type: String,
        trim: true
      }
    ],
    weaknesses: [
      {
        type: String,
        trim: true
      }
    ],
    importantMistakes: [mistakeItemSchema],
    betterApproach: {
      type: String,
      default: ''
    },
    retryRecommended: {
      type: Boolean,
      default: false
    },
    nextFocus: {
      type: String,
      default: 'Focus on clear transitions and concise delivery.'
    }
  },
  {
    timestamps: true
  }
);

communicationAnalysisSchema.index({ userId: 1, overallScore: 1 });

module.exports = mongoose.model('CommunicationAnalysis', communicationAnalysisSchema);