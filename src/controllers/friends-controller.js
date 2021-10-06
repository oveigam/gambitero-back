const mongoose = require('mongoose');

const Http500Error = require("../errors/http-500-error");
const HttpError = require("../errors/http-error");
const User = require("../models/user");
const getOrderStatusAmigo = require('../util/getOrderStatusAmigo');
const ExpoUtil = require("../util/expo-util")

module.exports.friends = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        // Recuperamos nuestro usuario
        const user = await User.findById(uid).populate('amigos.user', 'nombre username img');

        // Filtramos los amigos que nos tienen ignorados y los ordenamos por status
        const amigos = user.amigos.filter(a => a.status !== 'ignored').sort((a, b) => {
            const statusA = getOrderStatusAmigo(a.status);
            const statusB = getOrderStatusAmigo(b.status);
            return statusA - statusB;
        });

        res.json(amigos.map(a => a.toObject({ getters: true })))

    } catch (error) {
        console.error('Error en friends():', error)
        return next(new Http500Error(error))
    }
}

module.exports.acceptedFriends = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        // Recuperamos nuestro usuario
        const user = await User.findById(uid).populate('amigos.user', 'nombre username img');

        // Filtramos los amigos que nos tienen ignorados y los ordenamos por status
        const amigos = user.amigos.filter(a => a.status === 'accepted')

        res.json(amigos.map(a => a.user.toObject({ getters: true })))

    } catch (error) {
        console.error('Error en friends():', error)
        return next(new Http500Error(error))
    }
}

const friendAction = async (req, res, next, miAmigoStatus, suAmigoStatus, suEstado, miEstado) => {
    const uid = req.userData.uid;

    // Recuperamos el usuario de nuestro amigo
    const { amigoId } = req.body;
    const amigo = await User.findById(amigoId)
    if (!amigo) {
        return next(new HttpError(404, 'No existe el usuario'))
    }

    // Buscamos la asociacioen que nuestro amigo tiene de nosotros
    const yoComoAmigo = amigo.amigos.find(a => a.user.toString() === uid)
    if (!yoComoAmigo) {
        return next(new HttpError(404, 'No existe la amistad'))
    }
    // Aseguramos que el estado en el que el me tiene asociado es el correcto
    if (miEstado && yoComoAmigo.status !== miEstado) {
        return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
    }

    const yo = await User.findById(uid)

    // Busco el registro que tengo yo de mi amigo
    const elComoAmigo = yo.amigos.find(a => a.user.toString() === amigoId)
    if (!elComoAmigo) {
        return next(new HttpError(404, 'No existe la amistad'))
    }
    // Aseguramos que el estado del registro que tengo yo de mi amigo sea el correcto
    if (suEstado && elComoAmigo.status !== suEstado) {
        return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
    }

    if (yo.id === amigo.id) {
        return next(new HttpError(406, 'No puedes agregarte a ti mismo como amistad. Bastante triste por cierto...'))
    }

    if (miAmigoStatus === 'reject' && suAmigoStatus == 'reject') {
        // Si se rechaza borramos los registros de amigos en tanto en mi usuario como en el suyo
        yo.amigos.pop(elComoAmigo)
        amigo.amigos.pop(yoComoAmigo)
    } else {
        // Actualizamos el estado de los registros de amigos en tanto mi usuario como en el suyo
        elComoAmigo.status = miAmigoStatus
        yoComoAmigo.status = suAmigoStatus
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    await yo.save({ session: session });
    await amigo.save({ session: session });
    await session.commitTransaction();

    res.sendStatus(201)
}

module.exports.acceptFriend = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        // Recuperamos el usuario de nuestro amigo
        const { amigoId } = req.body;
        const amigo = await User.findById(amigoId)
        if (!amigo) {
            return next(new HttpError(404, 'No existe el usuario'))
        }

        // Buscamos la asociacion que nuestro amigo tiene de nosotros
        const yoComoAmigo = amigo.amigos.find(a => a.user.toString() === uid)
        if (!yoComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }

        // Aseguramos que el estado en el que el me tiene asociado es el correcto
        if (yoComoAmigo.status !== 'waiting') {
            return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
        }

        // Recupero mi usuario
        const yo = await User.findById(uid)

        // Busco el registro que tengo yo de mi amigo
        const elComoAmigo = yo.amigos.find(a => a.user.toString() === amigoId)
        if (!elComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }
        // Aseguramos que el estado del registro que tengo yo de mi amigo sea el correcto
        if (elComoAmigo.status !== 'pending') {
            return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
        }

        // Actualizamos el estado de los registros de amigos en tanto mi usuario como en el suyo
        const session = await mongoose.startSession();
        session.startTransaction();

        elComoAmigo.status = 'accepted'
        yoComoAmigo.status = 'accepted'

        await yo.save({ session: session });
        await amigo.save({ session: session });

        await session.commitTransaction();

        res.sendStatus(201)

    } catch (error) {
        console.error('Error en acceptFriend():', error)
        return next(new Http500Error(error))
    }
}

module.exports.rejectFriend = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        // Recuperamos el usuario de nuestro amigo
        const { amigoId } = req.body;
        const amigo = await User.findById(amigoId)
        if (!amigo) {
            return next(new HttpError(404, 'No existe el usuario'))
        }

        // Buscamos la asociacion que nuestro amigo tiene de nosotros
        const yoComoAmigo = amigo.amigos.find(a => a.user.toString() === uid)
        if (!yoComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }

        // Aseguramos que el estado en el que el me tiene asociado es el correcto
        if (yoComoAmigo.status !== 'waiting') {
            return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
        }

        // Recupero mi usuario
        const yo = await User.findById(uid)

        // Busco el registro que tengo yo de mi amigo
        const elComoAmigo = yo.amigos.find(a => a.user.toString() === amigoId)
        if (!elComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }
        // Aseguramos que el estado del registro que tengo yo de mi amigo sea el correcto
        if (elComoAmigo.status !== 'pending') {
            return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
        }

        // Actualizamos el estado de los registros de amigos en tanto mi usuario como en el suyo
        const session = await mongoose.startSession();
        session.startTransaction();

        yo.amigos.pop(elComoAmigo)
        amigo.amigos.pop(yoComoAmigo)

        await yo.save({ session: session });
        await amigo.save({ session: session });

        await session.commitTransaction();

        res.sendStatus(201)
    } catch (error) {
        console.error('Error en rejectFriend():', error)
        return next(new Http500Error(error))
    }
}

module.exports.borrarFriend = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        // Recuperamos el usuario de nuestro amigo
        const { amigoId } = req.body;
        const amigo = await User.findById(amigoId)
        if (!amigo) {
            return next(new HttpError(404, 'No existe el usuario'))
        }

        // Buscamos la asociacion que nuestro amigo tiene de nosotros
        const yoComoAmigo = amigo.amigos.find(a => a.user.toString() === uid)
        if (!yoComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }

        // Aseguramos que el estado en el que el me tiene asociado es el correcto
        if (yoComoAmigo.status !== 'accepted') {
            return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
        }

        // Recupero mi usuario
        const yo = await User.findById(uid)

        // Busco el registro que tengo yo de mi amigo
        const elComoAmigo = yo.amigos.find(a => a.user.toString() === amigoId)
        if (!elComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }
        // Aseguramos que el estado del registro que tengo yo de mi amigo sea el correcto
        if (elComoAmigo.status !== 'accepted') {
            return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
        }

        // Actualizamos el estado de los registros de amigos en tanto mi usuario como en el suyo
        const session = await mongoose.startSession();
        session.startTransaction();

        yo.amigos.pop(elComoAmigo)
        amigo.amigos.pop(yoComoAmigo)

        await yo.save({ session: session });
        await amigo.save({ session: session });

        await session.commitTransaction();

        res.sendStatus(201)

    } catch (error) {
        console.error('Error en rejectFriend():', error)
        return next(new Http500Error(error))
    }
}

module.exports.blockFriend = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        // Recuperamos el usuario de nuestro amigo
        const { amigoId } = req.body;
        const amigo = await User.findById(amigoId)
        if (!amigo) {
            return next(new HttpError(404, 'No existe el usuario'))
        }

        // Buscamos la asociacion que nuestro amigo tiene de nosotros
        const yoComoAmigo = amigo.amigos.find(a => a.user.toString() === uid)
        if (!yoComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }

        // Recupero mi usuario
        const yo = await User.findById(uid)

        // Busco el registro que tengo yo de mi amigo
        const elComoAmigo = yo.amigos.find(a => a.user.toString() === amigoId)
        if (!elComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }

        // Actualizamos el estado de los registros de amigos en tanto mi usuario como en el suyo
        const session = await mongoose.startSession();
        session.startTransaction();

        elComoAmigo.status = 'blocked'
        yoComoAmigo.status = 'ignored'

        await yo.save({ session: session });
        await amigo.save({ session: session });

        await session.commitTransaction();

        res.sendStatus(201)
    } catch (error) {
        console.error('Error en blockFriend():', error)
        return next(new Http500Error(error))
    }
}

module.exports.unblockFriend = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        // Recuperamos el usuario de nuestro amigo
        const { amigoId } = req.body;
        const amigo = await User.findById(amigoId)
        if (!amigo) {
            return next(new HttpError(404, 'No existe el usuario'))
        }

        // Buscamos la asociacion que nuestro amigo tiene de nosotros
        const yoComoAmigo = amigo.amigos.find(a => a.user.toString() === uid)
        if (!yoComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }

        // Aseguramos que el estado en el que el me tiene asociado es el correcto
        if (yoComoAmigo.status !== 'ignored') {
            return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
        }

        // Recupero mi usuario
        const yo = await User.findById(uid)

        // Busco el registro que tengo yo de mi amigo
        const elComoAmigo = yo.amigos.find(a => a.user.toString() === amigoId)
        if (!elComoAmigo) {
            return next(new HttpError(404, 'No existe la amistad'))
        }
        // Aseguramos que el estado del registro que tengo yo de mi amigo sea el correcto
        if (elComoAmigo.status !== 'blocked') {
            return next(new HttpError(406, 'El usuario no tiene el estado correcto.'))
        }

        // Actualizamos el estado de los registros de amigos en tanto mi usuario como en el suyo
        const session = await mongoose.startSession();
        session.startTransaction();

        yo.amigos.pop(elComoAmigo)
        amigo.amigos.pop(yoComoAmigo)

        await yo.save({ session: session });
        await amigo.save({ session: session });

        await session.commitTransaction();

        res.sendStatus(201)
    } catch (error) {
        console.error('Error en unblockFriend():', error)
        return next(new Http500Error(error))
    }
}

module.exports.addFriend = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        const { amigoUsername } = req.body;

        const amigo = await User.findOne({ username: amigoUsername })
        if (!amigo) {
            return next(new HttpError(404, 'No existe el usuario'))
        }

        // Comprobamos si ya hay un registro de amistad en el usuario que intentamos agregar
        const amistadPrevia = amigo.amigos.find(a => a.user.toString() === uid)
        if (amistadPrevia) {
            // Devolvemos el estado apropiado dependiendo del estado de dicho registro
            switch (amistadPrevia.status) {
                case 'accepted':
                    return next(new HttpError(406, 'Ya eres amigo de este usuario.'))
                case 'blocked':
                    return next(new HttpError(406, 'El usuario te ha bloqueado.'))
                case 'pending':
                    return next(new HttpError(406, 'Ya has enviado una solicitud a este usuario, espera su respuesta.'))
                case 'waiting':
                    return next(new HttpError(406, 'El usuario ya te ha enviado una solicitud, aceptarla para agregarlo.'))
                default:
                    throw new Error('Se encontro un registro de amistad sin status')
            }
        }

        const yo = await User.findById(uid)

        if (yo.id === amigo.id) {
            return next(new HttpError(406, 'No puedes agregarte a ti mismo como amistad. Bastante triste por cierto...'))
        }

        // Añadimos un registro a mi usario con mi amigo en espera
        yo.amigos.push({ user: amigo, status: 'waiting' })
        // Añadimos un registro al usuario del amigo en pendiente
        amigo.amigos.push({ user: yo, status: 'pending' })

        const session = await mongoose.startSession();
        session.startTransaction();
        await yo.save({ session: session });
        await amigo.save({ session: session });
        await session.commitTransaction();

        ExpoUtil.notificacionSolicitudAmistad(amigo._id, yo._id)

        res.sendStatus(201)

    } catch (error) {
        console.error('Error en addAmigo():', error)
        return next(new Http500Error(error))
    }
}