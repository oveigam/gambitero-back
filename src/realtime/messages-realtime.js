const Message = require("../models/message")
const Gambiteo = require("../models/gambiteo")
const User = require("../models/user")
const Sockets = require("../config/sockets")

module.exports = () => {
    Message.watch().on('change', async (change) => {

        const { operationType } = change

        switch (operationType) {
            case 'insert':
                await notifyInsert(change.fullDocument)
                break

            case 'update':
                await notifyReadByEveryone(change.documentKey, change.updateDescription.updatedFields)
                break
        }
    })

}

const notifyInsert = async (message, io) => {

    const gambiteo = await Gambiteo.findById(message.gambiteo)
    const sender = await User.findById(message.user)

    // Recorremos todos los participantes en el nuevo gambiteo para mandarselo
    for (let i = 0; i < gambiteo.participantes.length; i++) {

        // Generamos el id de la sala donde estaran todos los usuario que estan suscritos a este evento
        const partidipanteId = gambiteo.participantes[i].toString()
        const room = 'chat/' + partidipanteId

        if (message.user.toString() !== partidipanteId) {
            // Emitimos la action con el nuevo gambiteo a la sala
            Sockets.io.to(room).emit('subscription/chat', {
                type: 'chat/insert',
                payload: {
                    _id: message._id.toString(),
                    text: message.text,
                    createdAt: message.createdAt,
                    sent: true,
                    user: {
                        _id: sender._id,
                        name: sender.nombre,
                        avatar: sender.img
                    },
                    unread: true
                }
            })

            const unreadMessages = await Message.countDocuments({ gambiteo: gambiteo._id, readBy: { $ne: partidipanteId } })

            const msgCountRoom = 'gambiteo/' + partidipanteId
            Sockets.io.to(msgCountRoom).emit('subscription/gambiteo', {
                type: 'gambiteo/messageCount',
                payload: {
                    gid: gambiteo._id.toString(),
                    unreadMessages: unreadMessages
                }
            })

        }
    }
}

const readByArrayRegex = /^readBy\.[0-9]+$/

const notifyReadByEveryone = async (msgId, updatedFields) => {

    for (let key in updatedFields) {
        if (key.match(readByArrayRegex)) {
            const message = await Message.findById(msgId)
            const gambiteo = await Gambiteo.findById(message.gambiteo)
            const sender = message.user.toString()

            const readByEveryone = gambiteo.participantes.every(u => message.readBy.includes(u))
            if (readByEveryone) {
                const room = 'chat/' + sender
                Sockets.io.to(room).emit('subscription/chat', { type: 'chat/readByEveryone', payload: message._id.toString() })
            }
            break
        }
    }
}