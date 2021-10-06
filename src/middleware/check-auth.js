const tokenManager = require("../security/token-manager");
const Http500Error = require("../errors/http-500-error");
const HttpError = require("../errors/http-error");

module.exports = async (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return next(new HttpError(401, 'No authoization header present'))
        }
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decodedToken = await tokenManager.verifyToken(token)
            req.userData = { uid: decodedToken.uid }
            next();
        } catch (error) {
            console.info('Invalid token:', error.message)
            console.info('The received token was:', token)
            return next(new HttpError(401, 'No authoization'))
        }
    } catch (error) {
        console.error('checkAuth:', error)
        return next(new Http500Error(error))
    }
}