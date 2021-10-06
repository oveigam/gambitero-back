const { Router } = require('express');
const { check } = require('express-validator')

const usersController = require('../controllers/users-controller');
const checkAuth = require('../middleware/check-auth');
const imageUpload = require('../middleware/image-upload').imageUpload;
const validateResult = require('../middleware/validateResult');

const usersRouter = Router();

usersRouter.post('/login', usersController.login);

usersRouter.post('/refreshLogin', usersController.refreshLogin)

usersRouter.post('/refresh', usersController.refreshToken)

usersRouter.use(checkAuth);

usersRouter.delete('/logout', usersController.logout)

usersRouter.patch(
    '/',
    imageUpload.single('img'),
    usersController.updateProfile
)

usersRouter.post('/pushToken', usersController.setPushToken)

usersRouter.delete('/pushToken', usersController.deletePushToken)

usersRouter.post('/silenciarChat/:gambiteoId', usersController.silenciarChat)

module.exports = usersRouter;