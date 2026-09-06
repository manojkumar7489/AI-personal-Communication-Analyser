const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { AI_PERSONALITIES } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long']
    },
    avatar: {
      type: String,
      default: 'default-avatar.svg'
    },
    aiPersonality: {
      type: String,
      enum: Object.values(AI_PERSONALITIES),
      default: AI_PERSONALITIES.FRIEND
    },
    nativeLanguage: {
      type: String,
      default: 'English',
      trim: true
    },
    targetProficiency: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    voicePreferences: {
      rate: {
        type: Number,
        default: 1.0,
        min: 0.5,
        max: 2.0
      },
      pitch: {
        type: Number,
        default: 1.0,
        min: 0.5,
        max: 1.5
      },
      autoPlayAudio: {
        type: Boolean,
        default: true
      }
    },
    gamification: {
      xp: {
        type: Number,
        default: 0,
        min: 0
      },
      level: {
        type: Number,
        default: 1,
        min: 1
      },
      streakCount: {
        type: Number,
        default: 0,
        min: 0
      },
      lastActiveDate: {
        type: Date,
        default: Date.now
      }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);