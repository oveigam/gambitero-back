const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    text: { type: String, required: true },
    user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    gambiteo: { type: mongoose.Types.ObjectId, required: true, ref: 'Gambiteo' },
    readBy: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
},
    { timestamps: true }
)

module.exports = mongoose.model('Message', messageSchema);