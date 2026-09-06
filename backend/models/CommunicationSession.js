const mongoose = require('mongoose');
const { CONTEXT_TYPES } = require('../utils/constants');

const communicationSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sessionType: {
      type: String,
      enum: ['chat', 'context', 'story', 'challenge', 'interview', 'presentation', 'discussion'],
      required: true
    },
    contextType: {
      type: String,
      enum: Object.values(CONTEXT_TYPES),
      default: CONTEXT_TYPES.CASUAL
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress'
    },
    attemptNumber: {
      type: Number,
      default: 1,
      min: 1
    },
    parentSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunicationSession',
      default: null
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunicationAnalysis',
      default: null
    }
  },
  {
    timestamps: true
  }
);

communicationSessionSchema.index({ userId: 1, sessionType: 1, createdAt: -1 });

module.exports = mongoose.model('CommunicationSession', communicationSessionSchema);