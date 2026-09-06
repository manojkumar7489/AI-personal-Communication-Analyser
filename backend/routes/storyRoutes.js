const express = require('express');
const router = express.Router();
const { getPrompts, submitStory, getStoryHistory } = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/prompts', getPrompts);
router.post('/submit', submitStory);
router.get('/history', getStoryHistory);

module.exports = router;