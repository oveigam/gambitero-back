const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const Schema = mongoose.Schema;

const refreshTokenSchema = new Schema({
    uid: { type: String, required: true },
    token: { type: String, required: true, unique: true },
},
    { timestamps: true }
)

refreshTokenSchema.plugin(uniqueValidator)

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)