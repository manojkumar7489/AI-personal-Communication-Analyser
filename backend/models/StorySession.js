const mongoose = require('mongoose');

const storySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    promptTopic: {
      type: String,
      required: [true, 'Story topic is required'],
      trim: true
    },
    storyText: {
      type: String,
      required: [true, 'Story text cannot be empty'],
      trim: true
    },
    attempt: {
      type: Number,
      default: 1,
      min: 1
    },
    parentStoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StorySession',
      default: null
    },
    storyScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    breakdown: {
      structure: { type: Number, required: true, min: 0, max: 100 },
      clarity: { type: Number, required: true, min: 0, max: 100 },
      fluency: { type: Number, required: true, min: 0, max: 100 },
      vocabulary: { type: Number, required: true, min: 0, max: 100 },
      grammar: { type: Number, required: true, min: 0, max: 100 },
      engagement: { type: Number, required: true, min: 0, max: 100 }
    },
    strengths: [
      {
        type: String,
        trim: true
      }
    ],
    improvements: [
      {
        type: String,
        trim: true
      }
    ],
    betterStructure: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

storySessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('StorySession', storySessionSchema);