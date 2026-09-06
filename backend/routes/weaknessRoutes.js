const express = require('express');
const router = express.Router();
const { getWeaknessProfile, resolveHabit } = require('../controllers/weaknessController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/profile', getWeaknessProfile);
router.post('/resolve', resolveHabit);

module.exports = router;