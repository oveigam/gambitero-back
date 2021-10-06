const { Router } = require('express');
const { check } = require('express-validator')

const checkAuth = require('../middleware/check-auth');
const gambiteosController = require('../controllers/gambiteos-controller');
const validateResult = require('../middleware/validateResult');
const imageUpload = require('../middleware/image-upload').imageUpload;

const gambiteoRouter = Router();

gambiteoRouter.use(checkAuth);

gambiteoRouter.get('/feed', gambiteosController.feed)

gambiteoRouter.get('/:gambiteoId', gambiteosController.getById)

gambiteoRouter.post(
    '/',
    imageUpload.single('img'),
    [
        check('titulo').not().isEmpty(),
        validateResult
    ],
    gambiteosController.createGambiteo
)

gambiteoRouter.patch(
    '/',
    imageUpload.single('img'),
    [
        check('titulo').not().isEmpty(),
        validateResult
    ],
    gambiteosController.editGambiteo
)

gambiteoRouter.delete('/:gambiteoId', gambiteosController.deleteGambiteo)

gambiteoRouter.post('/votar', gambiteosController.votar)

gambiteoRouter.post('/confirmar', gambiteosController.confirmar)

gambiteoRouter.post('/invitar', gambiteosController.invitar)

module.exports = gambiteoRouter;
