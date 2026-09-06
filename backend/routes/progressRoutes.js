const express = require('express');
const router = express.Router();
const { getDashboardMetrics, getAnalytics } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardMetrics);
router.get('/analytics', getAnalytics);

module.exports = router;