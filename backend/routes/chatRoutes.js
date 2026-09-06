const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversationById,
  sendMessage,
  deleteConversation
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { validateChatMessage } = require('../middleware/validationMiddleware');

// All chat routes require JWT authentication
router.use(protect);

router.post('/conversation', createConversation);
router.get('/conversations', getConversations);
router.get('/conversation/:id', getConversationById);
router.post('/message', validateChatMessage, sendMessage);
router.delete('/conversation/:id', deleteConversation);

module.exports = router;