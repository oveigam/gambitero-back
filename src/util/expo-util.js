const { Expo } = require('expo-server-sdk');
const moment = require('moment');

const Sockets = require('../config/sockets');

const Gambiteo = require('../models/gambiteo');
const User = require('../models/user');

const expo = new Expo()

const sendNotifications = async (notifications) => {
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
}

exports.notificationsesNuevoGambiteo = async (gid) => {

    const gambiteo = await Gambiteo.findById(gid).populate('participantes', 'pushToken notificacionesConfig')

    const notifications = []
    for (let participante of gambiteo.participantes) {

        // Creamos la notificacion para los participantes (users) que:
        // - Tegan pushToken valido
        // - No sean el creador
        // - Tenga activadas las notificaciones
        if (Expo.isExpoPushToken(participante.pushToken) &&
            participante._id.toString() !== gambiteo.propietario.toString() &&
            participante.notificacionesConfig.nuevoGambiteo) {

            notifications.push({
                to: participante.pushToken,
                sound: 'default',
                title: 'Nuevo gambiteo',
                body: gambiteo.titulo,
                data: {
                    type: 'gambiteo',
                    gid: gid.toString()
                },
            })

        }
    }

    sendNotifications(notifications)
}

exports.notificationsesInvitacionGambiteo = async (nuevosParticipantesIds, gid) => {

    const gambiteo = await Gambiteo.findById(gid)
    const nuevosParticipantes = await User.find({ _id: { $in: nuevosParticipantesIds } })

    const notifications = []
    for (let participante of nuevosParticipantes) {

        // Creamos la notificacion para los participantes (users) que:
        // - Tegan pushToken valido
        // - Tenga activadas las notificaciones
        if (Expo.isExpoPushToken(participante.pushToken) &&
            participante.notificacionesConfig.nuevoGambiteo) {

            notifications.push({
                to: participante.pushToken,
                sound: 'default',
                title: 'Nuevo gambiteo',
                body: gambiteo.titulo,
                data: {
                    type: 'gambiteo',
                    gid: gid.toString()
                },
            })

        }
    }

    sendNotifications(notifications)
}

exports.notificacionSolicitudAmistad = async (amigoId, solicitanteId) => {

    const amigo = await User.findById(amigoId)
    const solicitante = await User.findById(solicitanteId)

    if (Expo.isExpoPushToken(amigo.pushToken) &&
        amigo.notificacionesConfig.solicitudAmistad) {
        sendNotifications([{
            to: amigo.pushToken,
            sound: 'default',
            title: 'Nueva solicitud de amistad',
            body: `${solicitante.nombre} quiere ser tu amigo.`,
            data: {
                type: 'amistad'
            },
        }])
    }

}

exports.notificationChat = async (gid, text, senderId) => {

    const sender = await User.findById(senderId)

    // Recuperamos los usuarios que estan conectados al chat
    const usersInRoom = []
    const clientsInRoom = Sockets.io.sockets.adapter.rooms.get(gid)
    if (clientsInRoom) {
        clientsInRoom.forEach(clientId => {
            const socket = Sockets.io.sockets.sockets.get('chat/' + clientId)
            if (socket) {
                usersInRoom.push(socket.uid)
            }
        })
    }

    // Buscamos los participantes de
    const gambiteo = await Gambiteo.findById(gid).populate('participantes', 'pushToken notificacionesConfig silencedChats')
    const notifications = []
    for (let participante of gambiteo.participantes) {

        let silence = false
        if (participante.silencedChats && participante.silencedChats.get(gid)) {
            const silencedUntil = participante.silencedChats.get(gid)
            silence = moment().isBefore(silencedUntil)
        }

        // Creamos la notificacion para los participantes (users) que:
        // - Tengan un push token valido
        // - No sean la persona que envio el chat
        // - No esten ya presentes en el chat
        // - Tiene las notificaciones activadas
        // - No tiene el chat silenciado
        if (Expo.isExpoPushToken(participante.pushToken) &&
            participante._id.toString() !== sender._id.toString() &&
            !Sockets.io.sockets.adapter.rooms.get('chat/' + participante._id.toString()) &&
            participante.notificacionesConfig.chat &&
            !silence) {

            notifications.push({
                to: participante.pushToken,
                sound: 'default',
                title: gambiteo.titulo,
                body: `${sender.nombre}: ${text}`,
                data: {
                    type: 'chat',
                    gid: gid
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
}