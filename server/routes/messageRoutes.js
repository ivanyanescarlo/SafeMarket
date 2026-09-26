const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  getUnreadMessageCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/unread-count', getUnreadMessageCount);
router.get('/conversations', getConversations);
router.post('/start', startConversation);
router.get('/:conversationId', getMessages);
router.post('/:conversationId', sendMessage);

module.exports = router;
