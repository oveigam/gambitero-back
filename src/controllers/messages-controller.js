const Http500Error = require("../errors/http-500-error");
const Message = require("../models/message");
const Gambiteo = require("../models/gambiteo");
const ExpoUtil = require("../util/expo-util")

exports.fetchChatMessages = async (req, res, next) => {
    try {
        const uid = req.userData.uid
        const { gid } = req.params

        // Recuperamos el gambiteo de BBDD por su id
        const gambiteo = await Gambiteo.findById(gid)

        // Controlamos que exista y que el usuario participe en el
        if (!gambiteo) {
            return next(new HttpError(404, 'Gambiteo no encontrado.'))
        }
        if (!gambiteo.participantes.includes(uid)) {
            return next(new HttpError(403, 'Este gambiteo no es para ti tunante.'))
        }

        const messages = await Message.find({ gambiteo: gid }).populate({ path: 'user', select: 'nombre img' }).sort('-createdAt')

        const unreadChatMessages = []
        const chatMessages = []
        let unreadLabel = false

        for (let message of messages) {
            if (!message.readBy.includes(uid)) {
                unreadChatMessages.push(message._id)
            } else {
                if (!unreadLabel && unreadChatMessages.length > 0) {
                    chatMessages.push({
                        _id: 'unread-system-label',
                        text: 'Mensajes sin leer',
                        createdAt: message.createdAt,
                        system: true,
                        user: {
                            _id: 'system',
                        }
                    })
                    unreadLabel = true
                }
            }

            const readByEveryone = gambiteo.participantes.every(u => message.readBy.includes(u))

            chatMessages.push({
                _id: message._id.toString(),
                text: message.text,
                createdAt: message.createdAt,
                sent: true,
                received: readByEveryone,
                user: {
                    _id: message.user._id,
                    name: message.user.nombre,
                    avatar: message.user.img
                }
            })
        }

        if (unreadChatMessages) {
            await Message.updateMany(
                { _id: { $in: unreadChatMessages } },
                { $push: { readBy: uid } }
            )
        }

        res.status(201).json(chatMessages)

    } catch (error) {
        console.error('Error en fetchMessages():', error)
        return next(new Http500Error(error))
    }
}

exports.sendMessage = async (req, res, next) => {
    try {
        const uid = req.userData.uid
        const { text, gid } = req.body

        const message = new Message({
            text: text,
            user: uid,
            gambiteo: gid,
            readBy: [uid]
        })

        await message.save()

        ExpoUtil.notificationChat(gid, text, uid)

        res.status(201).json(message.toObject({ getters: true }))

    } catch (error) {
        console.error('Error en sendMessage():', error)
        return next(new Http500Error(error))
    }
}

exports.markAsRead = async (req, res, next) => {
    try {
        const uid = req.userData.uid;
        const msgId = req.params.msgId;

        await Message.updateOne({ _id: msgId }, { $push: { readBy: uid } })

        res.json({ msgId: msgId });
    } catch (error) {
        console.error('Error en markAsRead():', error)
        return next(new Http500Error(error))
    }
}
