const Sockets = require("../config/sockets")
const Gambiteo = require("../models/gambiteo")
const Message = require("../models/message")

module.exports = () => {
    Gambiteo.watch().on('change', async (change) => {

        const { operationType } = change

        switch (operationType) {
            case 'insert':
                await notifyInsert(change.fullDocument)
                break

            case 'update':
                await notifyUpdateDeleted(change)
                break

        }
    })
}

const notifyInsert = async (gambiteo) => {
    // Recorremos todos los participantes en el nuevo gambiteo para mandarselo
    for (let i = 0; i < gambiteo.participantes.length; i++) {

        const unreadMessages = await Message.countDocuments({ gambiteo: gambiteo._id, readBy: { $ne: gambiteo.participantes[i].toString() } })

        // Generamos el id de la sala donde estaran todos los usuario que estan suscritos a este evento
        const partidipanteId = gambiteo.participantes[i].toString()
        const room = 'gambiteo/' + partidipanteId

        // Emitimos la action con el nuevo gambiteo a la sala
        Sockets.io.to(room).emit('subscription/gambiteo', {
            type: 'gambiteo/add',
            payload: {
                ...gambiteo,
                id: gambiteo._id,
                unreadMessages: unreadMessages
            }
        })
    }
}

const notifyUpdateDeleted = async ({ updateDescription, documentKey }) => {

    if (updateDescription.updatedFields.deleted) {
        notifyDelete(documentKey)
    } else {
        notifyUpdate(documentKey)
    }

}

const notifyUpdate = async (gid) => {
    // Recuperamos el gambiteo editado
    const gambiteo = await Gambiteo.findById(gid).populate('participantes', 'nombre username img')
    await Gambiteo.populate(gambiteo, { path: 'campos.valores.votos', select: 'nombre username img' })
    await Gambiteo.populate(gambiteo, { path: 'campos.valores.confirmaciones.user', select: 'nombre username img' })

    // Recorremos todos los participantes en el gambiteo editado para mandarselo
    for (let i = 0; i < gambiteo.participantes.length; i++) {

        const unreadMessages = await Message.countDocuments({ gambiteo: gambiteo._id, readBy: { $ne: gambiteo.participantes[i]._id.toString() } })
        const gambiteoResponse = gambiteo.toObject({ getters: true })
        gambiteoResponse.unreadMessages = unreadMessages

        // Generamos el id de la sala donde estaran todos los usuario que estan suscritos a este evento
        const partidipanteId = gambiteo.participantes[i]._id.toString()
        const room = 'gambiteo/' + partidipanteId

        // Emitimos la action con el gambiteo editado a la sala
        Sockets.io.to(room).emit('subscription/gambiteo', {
            type: 'gambiteo/update',
            payload: gambiteoResponse
        })
    }
}

const notifyDelete = async (gid) => {
    // Recuperamos el gambiteo editado
    const gambiteo = await Gambiteo.findOneDeleted({ _id: gid })

    // Recorremos todos los participantes en el gambiteo editado para mandarselo
    for (let i = 0; i < gambiteo.participantes.length; i++) {

        // Generamos el id de la sala donde estaran todos los usuario que estan suscritos a este evento
        const partidipanteId = gambiteo.participantes[i].toString()
        const room = 'gambiteo/' + partidipanteId

        // Emitimos la action con el gambiteo borrado a la sala
        Sockets.io.to(room).emit('subscription/gambiteo', {
            type: 'gambiteo/remove',
            payload: gambiteo._id
        })
    }
}