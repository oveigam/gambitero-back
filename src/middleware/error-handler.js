const handleErrors = (error, req, res, next) => {
    if (res.headerSent) {
        return next(error)
    }
    res.status(error.code || 500).json({ message: error.message || 'Error desconido' })
}

module.exports = handleErrors