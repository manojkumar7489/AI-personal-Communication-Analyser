const mongoose = require('mongoose');

const workoutTaskSchema = new mongoose.Schema(
  {
    stepNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    moduleType: {
      type: String,
      enum: ['chat', 'storytelling', 'vocabulary', 'interview', 'challenge'],
      required: true
    },
    durationMinutes: {
      type: Number,
      default: 5
    },
    targetWeakness: {
      type: String,
      default: 'general_fluency',
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const dailyChallengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assignedDate: {
      type: String,
      required: true // 'YYYY-MM-DD'
    },
    tasks: [workoutTaskSchema],
    isWorkoutCompleted: {
      type: Boolean,
      default: false
    },
    xpAwarded: {
      type: Number,
      default: 100
    }
  },
  {
    timestamps: true
  }
);

dailyChallengeSchema.index({ userId: 1, assignedDate: 1 }, { unique: true });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);