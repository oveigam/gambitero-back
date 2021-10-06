const Http500Error = require('../errors/http-500-error');
const HttpError = require('../errors/http-error');
const tokenManager = require('../security/token-manager')

module.exports = async (socket, next) => {
    try {
        if (!socket.handshake.auth || !socket.handshake.auth.token) {
            console.info('No socket authoization header present')
            return next(new HttpError(401, 'No authoization header present'))
        }
        try {
            const decodedToken = await tokenManager.verifyToken(socket.handshake.auth.token)
            socket.uid = decodedToken.uid;
            next();
        } catch (error) {
            console.info('Invalid socket token:', error.message)
            return next(new HttpError(401, 'No authoization'))
        }
    } catch (error) {
        console.error('checkAuthSocket:', error)
        return next(new Http500Error(error))
    }
}