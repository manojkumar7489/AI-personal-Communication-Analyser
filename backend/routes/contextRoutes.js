const express = require('express');
const router = express.Router();
const { getContextList, startContextSession } = require('../controllers/contextController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/list', getContextList);
router.post('/start', startContextSession);

module.exports = router;