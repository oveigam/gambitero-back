const { v4: uuid } = require('uuid');

module.exports = (originalname) => {
    const extension = originalname.substr(originalname.lastIndexOf('.') + 1);
    return uuid() + '.' + extension
}