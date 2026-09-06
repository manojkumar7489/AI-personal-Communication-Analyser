const mongoose = require('mongoose');

const dailySnapshotSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true // 'YYYY-MM-DD'
    },
    avgOverallScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    minutesPracticed: {
      type: Number,
      default: 0,
      min: 0
    },
    sessionsCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    lifetimeSessions: {
      type: Number,
      default: 0,
      min: 0
    },
    lifetimeMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    currentAverageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    skillAverages: {
      grammar: { type: Number, default: 0, min: 0, max: 100 },
      fluency: { type: Number, default: 0, min: 0, max: 100 },
      vocabulary: { type: Number, default: 0, min: 0, max: 100 },
      clarity: { type: Number, default: 0, min: 0, max: 100 },
      confidence: { type: Number, default: 0, min: 0, max: 100 },
      structure: { type: Number, default: 0, min: 0, max: 100 }
    },
    dailySnapshots: [dailySnapshotSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('UserProgress', userProgressSchema);