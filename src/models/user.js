const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator')

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    img: { type: String, required: false },
    nombre: { type: String, required: false },
    amigos: [{
        user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
        status: { type: String, required: true, enum: ['accepted', 'blocked', 'pending', 'waiting', 'ignored'] },
    }],
    gambiteos: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Gambiteo' }],
    pushToken: { type: String, required: false },
    notificacionesConfig: {
        nuevoGambiteo: { type: Boolean, required: true, default: true },
        solicitudAmistad: { type: Boolean, required: true, default: true },
        chat: { type: Boolean, required: true, default: true },
    },
    silencedChats: {
        type: Map,
        of: Date
    }
},
    { timestamps: true }
)

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)