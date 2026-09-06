const mongoose = require('mongoose');

const inlineFeedbackSchema = new mongoose.Schema(
  {
    triggered: {
      type: Boolean,
      default: false
    },
    interventionType: {
      type: String,
      enum: ['filler', 'repetition', 'structure', 'conciseness', 'example_needed', 'none'],
      default: 'none'
    },
    feedbackText: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    participantName: {
      type: String,
      default: 'AI Friend',
      trim: true
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true
    },
    speechDurationSec: {
      type: Number,
      default: 0,
      min: 0
    },
    inlineFeedback: inlineFeedbackSchema
  },
  {
    timestamps: true
  }
);

// Index for chronological turn fetching
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);