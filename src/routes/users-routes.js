const { Router } = require('express');
const { check } = require('express-validator')

const usersController = require('../controllers/users-controller');
const checkAuth = require('../middleware/check-auth');
const imageUpload = require('../middleware/image-upload').imageUpload;
const validateResult = require('../middleware/validateResult');

const usersRouter = Router();

usersRouter.post('/signup',
    [
        check('username').not().isEmpty(),
        check('email').normalizeEmail({ gmail_remove_dots: false }).isEmail(),
        check('password').isLength({ min: 6 }),
        validateResult
    ],
    usersController.signUp
)

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