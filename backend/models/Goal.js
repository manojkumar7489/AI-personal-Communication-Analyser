const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetArea: {
      type: String,
      enum: [
        'general_fluency',
        'interview_readiness',
        'public_speaking',
        'reduce_fillers',
        'storytelling_mastery',
        'vocabulary_expansion'
      ],
      required: true
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true
    },
    targetMetricScore: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 80
    },
    currentScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    deadline: {
      type: Date,
      default: null
    },
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

goalSchema.index({ userId: 1, isCompleted: 1 });

module.exports = mongoose.model('Goal', goalSchema);