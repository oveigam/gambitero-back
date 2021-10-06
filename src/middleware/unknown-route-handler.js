const HttpError = require("../errors/http-error");

const handleUnknownRoute = (req, res, next) => {
    return next(new HttpError(404, 'Ruta no encontrada'));
}

module.exports = handleUnknownRoute