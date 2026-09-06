const express = require('express');
const router = express.Router();
const { startPresentation, evaluatePresentation } = require('../controllers/presentationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start', startPresentation);
router.post('/evaluate', evaluatePresentation);

module.exports = router;