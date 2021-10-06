const { Router } = require('express');

const friendsController = require('../controllers/friends-controller');
const checkAuth = require('../middleware/check-auth');

const friendsRouter = Router();

friendsRouter.use(checkAuth)

friendsRouter.get('/', friendsController.friends)

friendsRouter.get('/accepted', friendsController.acceptedFriends)

friendsRouter.post('/accept', friendsController.acceptFriend)

friendsRouter.post('/reject', friendsController.rejectFriend)

friendsRouter.post('/delete', friendsController.borrarFriend)

friendsRouter.post('/block', friendsController.blockFriend)

friendsRouter.post('/unblock', friendsController.unblockFriend)

friendsRouter.post('/', friendsController.addFriend)

module.exports = friendsRouter;