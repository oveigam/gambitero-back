class Http500Error extends Error {
    constructor(error) {
        super(error.message)
        this.code = 500
    }
}

module.exports = Http500Error;