const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    badgeCode: {
      type: String,
      required: true,
      enum: [
        'FIRST_CONVERSATION',
        'STREAK_7_DAY',
        'STORYTELLER',
        'INTERVIEW_READY',
        'FLUENCY_BUILDER',
        'PRACTICE_100_MIN',
        'CONFIDENCE_BOOSTER'
      ]
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    icon: {
      type: String,
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

achievementSchema.index({ userId: 1, badgeCode: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);