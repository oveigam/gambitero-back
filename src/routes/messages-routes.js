const { Router } = require('express');

const checkAuth = require('../middleware/check-auth');
const messagesController = require('../controllers/messages-controller');

const messagesRouter = Router();

messagesRouter.use(checkAuth);

messagesRouter.get('/:gid', messagesController.fetchChatMessages)

messagesRouter.post('/sendMessage', messagesController.sendMessage)

messagesRouter.patch('/:msgId', messagesController.markAsRead)

module.exports = messagesRouter;