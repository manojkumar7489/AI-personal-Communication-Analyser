const express = require('express');
const router = express.Router();
const {
  startInterview,
  answerQuestion,
  getInterviewSession
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start', startInterview);
router.post('/answer', answerQuestion);
router.get('/:id', getInterviewSession);

module.exports = router;