const mongoose = require('mongoose');
const { COMMUNICATION_MODES, CONTEXT_TYPES } = require('../utils/constants');

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'New Conversation'
    },
    mode: {
      type: String,
      enum: Object.values(COMMUNICATION_MODES),
      default: COMMUNICATION_MODES.FRIEND_CHAT
    },
    contextType: {
      type: String,
      enum: Object.values(CONTEXT_TYPES),
      default: CONTEXT_TYPES.CASUAL
    },
    isActive: {
      type: Boolean,
      default: true
    },
    totalTurns: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast timeline listing per user & mode
conversationSchema.index({ userId: 1, mode: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);