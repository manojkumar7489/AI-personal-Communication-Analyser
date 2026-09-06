const express = require('express');
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  getAchievements
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.get('/achievements', getAchievements);

module.exports = router;