const jwt = require('jsonwebtoken');

const generateToken = async (uid) => {
    const token = await jwt.sign({ uid: uid }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_EXPIRATION_TIME })
    return token;
}

const generateRefreshToken = async (uid) => {
    const token = await jwt.sign({ uid: uid }, process.env.REF_TOKEN_SECRET)
    return token;
}

const decodeToken = (token) => {
    return jwt.decode(token, process.env.TOKEN_SECRET)
}

const verifyToken = async (token) => {
    const decoded = await jwt.verify(token, process.env.TOKEN_SECRET)
    return decoded;
}

const verifyRefreshToken = async (token) => {
    const decoded = await jwt.verify(token, process.env.REF_TOKEN_SECRET)
    return decoded;
}

exports.generateToken = generateToken;
exports.generateRefreshToken = generateRefreshToken;
exports.decodeToken = decodeToken;
exports.verifyToken = verifyToken;
exports.verifyRefreshToken = verifyRefreshToken;