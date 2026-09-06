const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, setAiPersonality } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/personality', setAiPersonality);

module.exports = router;