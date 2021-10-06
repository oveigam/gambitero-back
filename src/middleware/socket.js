const jwt = require('jsonwebtoken');
const { Expo } = require('expo-server-sdk')
const moment = require('moment');

const User = require('./../models/user')
const Message = require('./../models/message');
const Gambiteo = require('../models/gambiteo');

let expo = new Expo()

module.exports = (io) => {
    io.use((socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token) {
            jwt.verify(socket.handshake.query.token, process.env.TOKEN_SECRET, (err, decoded) => {
                if (err) return next(new Error('Authentication error'));
                socket.uid = decoded.uid;
                next();
            });
        } else {
            next(new Error('Authentication error'));
        }
    }).on('connection', async (socket) => {
        // Abrimos una sala con el id del usuario
        socket.join(socket.uid.toString())

        // console.log('socket connected', socket.id)

        socket.on('disconnect', () => {
            // console.log('socket disconnected', socket.id)
        })

        socket.on('action', async action => {
            const { type, data } = action

            switch (type) {
                case 'server/join':
                    try {
                        const joiningUser = await User.findById(socket.uid)

                        let silenced = false
                        if (joiningUser.silencedChats && joiningUser.silencedChats.get(data.gid)) {
                            const silencedUntil = joiningUser.silencedChats.get(data.gid)
                            silenced = moment().isBefore(silencedUntil)
                        }

                        const messages = await Message.find({ gambiteo: data.gid }).populate({ path: 'user', select: 'nombre img' }).sort('-createdAt')
                        const unread = []
                        const giftedMessages = []

                        let unreadLabel = false
                        for (let m of messages) {
                            if (!m.readBy.includes(socket.uid)) {
                                unread.push(m._id)
                            } else {
                                if (!unreadLabel && unread.length > 0) {
                                    giftedMessages.push({
                                        _id: 'unread-system-label',
                                        text: 'Mensajes sin leer',
                                        createdAt: m.createdAt,
                                        system: true,
                                    })
                                    unreadLabel = true
                                }
                            }

                            giftedMessages.push({
                                _id: m._id.toString(),
                                text: m.text,
                                createdAt: m.createdAt,
                                sent: true,
                                user: {
                                    _id: m.user._id,
                                    name: m.user.nombre,
                                    avatar: m.user.img
                                }
                            })
                        }

                        socket.join(data.gid)
                        socket.emit("action", { type: "join", data: { messages: giftedMessages, silenced: silenced } })

                        if (unread) {
                            await Message.updateMany(
                                { _id: { $in: unread } },
                                { $push: { readBy: socket.uid } }
                            )
                        }

                    } catch (error) {
                        console.error('ERROR', error)
                    }
                    break;

                case 'server/leave':
                    socket.leave(data.gid)
                    socket.emit("action", { type: "leave", data: [] })
                    break;

                case 'server/message':
                    try {
                        const user = await User.findById(socket.uid)
                        const message = await new Message({
                            text: data.text,
                            user: user,
                            gambiteo: data.gid,
                            readBy: [user]
                        }).save()

                        const msg = {
                            _id: message._id.toString(),
                            text: data.text,
                            createdAt: message.createdAt,
                            sent: true,
                            user: {
                                _id: socket.uid,
                                name: user.nombre,
                                avatar: user.img
                            }
                        }

                        // Enviamos el chat a la sala de chat
                        socket.broadcast.to(data.gid).emit("action", { type: "message", data: msg })
                        socket.emit("action", { type: "saved", data: { _id: msg._id, tempId: data.tempId } })

                        // Recuperamos los usuarios que estan conectados al chat
                        const usersInRoom = []
                        const clientsInRoom = io.sockets.adapter.rooms.get(data.gid)
                        if (clientsInRoom) {
                            clientsInRoom.forEach(clientId => {
                                const socket = io.sockets.sockets.get(clientId)
                                if (socket) {
                                    usersInRoom.push(socket.uid)
                                }
                            })
                        }

                        // Buscamos los participantes de
                        const gambiteo = await Gambiteo.findById(data.gid).populate('participantes', 'pushToken notificacionesConfig silencedChats')
                        const notifications = []
                        for (let participante of gambiteo.participantes) {

                            let silence = false
                            if (participante.silencedChats && participante.silencedChats.get(data.gid)) {
                                const silencedUntil = participante.silencedChats.get(data.gid)
                                silence = moment().isBefore(silencedUntil)
                            }

                            // Creamos la notificacion para los participantes (users) que:
                            // - Tengan un push token valido
                            // - No sean la persona que envio el chat
                            // - No esten ya presentes en el chat
                            // - Tiene las notificaciones activadas
                            // - No tiene el chat silenciado
                            if (Expo.isExpoPushToken(participante.pushToken) &&
                                participante._id.toString() !== user._id.toString() &&
                                !usersInRoom.includes(participante._id.toString()) &&
                                participante.notificacionesConfig.chat &&
                                !silence) {

                                notifications.push({
                                    to: participante.pushToken,
                                    sound: 'default',
                                    title: gambiteo.titulo,
                                    body: `${user.nombre}: ${data.text}`,
                                    data: {
                                        type: 'chat',
                                        gid: data.gid
                                    },
                                })

                            }
                        }

                        // Enviamos las notificaciones
                        // Los tikets son la respuesta del servidor de notificaciones, de momento no necesito hacer nada con ellos
                        let chunks = expo.chunkPushNotifications(notifications);
                        let tickets = [];
                        for (let chunk of chunks) {
                            try {
                                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                                tickets.push(...ticketChunk);
                            } catch (error) {
                                console.error(error);
                            }
                        }

                    } catch (error) {
                        console.error('ERROR NOTIFICACIONES', error)
                    }
                    break;
            }
        })

        socket.emit('ready')

    });
}