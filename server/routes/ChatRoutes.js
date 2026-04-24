const express = require('express');
const router = express.Router();
const {
	getChats,
	getMessages,
	createOrGetChat,
	sendMessage,
	markChatAsRead,
	sendOffer,
	respondToOffer,
	proposeMeetup,
	respondToMeetup,
} = require('../controllers/ChatController');
const requireAuth = require('../middleware/requireAuth');
const upload = require('../middleware/upload');

router.use(requireAuth);
router.get('/', getChats);
router.get('/:chatId/messages', getMessages);
router.post('/:chatId/read', markChatAsRead);
router.post('/start', createOrGetChat);
router.post('/send', upload.single('attachment'), sendMessage);
router.post('/offer', sendOffer);
router.post('/offer/respond', respondToOffer);
router.post('/meetup', proposeMeetup);
router.post('/meetup/respond', respondToMeetup);

module.exports = router;