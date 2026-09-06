const express = require('express');
const router = express.Router();
const {
  getDiscussionTopics,
  startDiscussion,
  submitDiscussionTurn
} = require('../controllers/discussionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/topics', getDiscussionTopics);
router.post('/start', startDiscussion);
router.post('/turn', submitDiscussionTurn);

module.exports = router;