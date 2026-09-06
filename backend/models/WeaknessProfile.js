const mongoose = require('mongoose');

const fillerWordSchema = new mongoose.Schema(
  {
    word: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    count: {
      type: Number,
      default: 1,
      min: 0
    },
    lastObserved: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const structuralHabitSchema = new mongoose.Schema(
  {
    habitKey: {
      type: String,
      required: true,
      enum: [
        'jumping_ideas',
        'abrupt_conclusion',
        'too_short',
        'rambling',
        'missing_examples',
        'weak_intro'
      ]
    },
    frequency: {
      type: Number,
      default: 1,
      min: 0
    },
    resolved: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const grammarIssueSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: Number,
      default: 1,
      min: 0
    }
  },
  { _id: false }
);

const weaknessProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    fillerWords: [fillerWordSchema],
    structuralHabits: [structuralHabitSchema],
    grammarIssues: [grammarIssueSchema],
    activeInterventionRules: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('WeaknessProfile', weaknessProfileSchema);