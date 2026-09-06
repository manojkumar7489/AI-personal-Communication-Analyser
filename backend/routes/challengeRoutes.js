const express = require('express');
const router = express.Router();
const {
  getChallengePrompt,
  evaluateChallenge,
  getDailyWorkout,
  completeWorkoutStep
} = require('../controllers/challengeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/prompt', getChallengePrompt);
router.post('/evaluate', evaluateChallenge);
router.get('/daily', getDailyWorkout);
router.post('/daily/complete-step', completeWorkoutStep);

module.exports = router;