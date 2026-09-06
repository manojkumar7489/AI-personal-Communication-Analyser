const express = require('express');
const router = express.Router();
const {
  analyzeSession,
  getAnalysisBySession,
  compareRetry
} = require('../controllers/analysisController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/session', analyzeSession);
router.get('/:sessionId', getAnalysisBySession);
router.post('/retry', compareRetry);

module.exports = router;