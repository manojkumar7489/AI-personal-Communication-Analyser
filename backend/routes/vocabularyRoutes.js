const express = require('express');
const router = express.Router();
const { getRecommendations, markPracticed } = require('../controllers/vocabularyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/recommendations', getRecommendations);
router.post('/mark-practiced', markPracticed);

module.exports = router;