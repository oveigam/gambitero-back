const HttpError = require("../errors/http-error");
const Gambiteo = require('../models/gambiteo');
const Http500Error = require("../errors/http-500-error");
const Message = require("../models/message");
const ExpoUtil = require("../util/expo-util");
const { deleteImage } = require("../middleware/image-upload");

const feed = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        const gambiteos = await Gambiteo.find({ participantes: uid }, '-campos').populate('participantes', 'nombre').sort('-updatedAt')

        const respuesta = []
        for (let g of gambiteos) {
            const unreadMessages = await Message.countDocuments({ gambiteo: g, readBy: { $ne: uid } })
            const gambiteo = g.toObject({ getters: true })
            gambiteo.unreadMessages = unreadMessages

            respuesta.push(gambiteo)
        }

        res.json(respuesta);
    } catch (error) {
        console.error('Error en feed():', error)
        return next(new Http500Error(error))
    }
}

const getById = async (req, res, next) => {
    try {
        const gid = req.params.gambiteoId;
        const uid = req.userData.uid;

        const gambiteo = await Gambiteo.findById(gid).populate('participantes', 'nombre username img')

        await Gambiteo.populate(gambiteo, { path: 'campos.valores.votos', select: 'nombre username img' })
        await Gambiteo.populate(gambiteo, { path: 'campos.valores.confirmaciones.user', select: 'nombre username img' })

        if (!gambiteo) {
            return next(new HttpError(404, 'Gambiteo no encontrado.'))
        }

        if (!gambiteo.participantes.some(par => par._id.toString() === uid)) {
            return next(new HttpError(403, 'Este gambiteo no es para ti tunante.'))
        }

        res.json(gambiteo.toObject({ getters: true }));
    } catch (error) {
        console.error('Error en getById():', error)
        return next(new Http500Error(error))
    }
}

const createGambiteo = async (req, res, next) => {
    try {
        const uid = req.userData.uid;
        const { titulo, descripcion, participantes, campos } = req.body
        const img = req.file ? req.file.location : undefined;

        const participantesToSave = participantes ? JSON.parse(participantes) : [];
        participantesToSave.push(uid)

        const camposToSave = campos ? JSON.parse(campos) : []

        const createdGambiteo = new Gambiteo({
            titulo,
            descripcion,
            img,
            propietario: uid,
            participantes: participantesToSave,
            campos: camposToSave,
        })

        await createdGambiteo.save();

        ExpoUtil.notificationsesNuevoGambiteo(createdGambiteo._id)

        const gambiteo = await Gambiteo.findById(createdGambiteo._id, '-campos').populate('participantes', 'nombre')

        res.status(201).json(gambiteo.toObject({ getters: true }));
    } catch (error) {
        console.error('Error en createGambiteo():', error)
        return next(new Http500Error(error))
    }
}

const editGambiteo = async (req, res, next) => {
    try {
        const uid = req.userData.uid;
        const { id, titulo, descripcion, participantes, campos } = req.body
        const img = req.file ? req.file.location : undefined;

        const participantesToSave = participantes ? JSON.parse(participantes) : [];

        const camposToSave = campos ? JSON.parse(campos) : []

        const gambiteo = await Gambiteo.findById(id)
        if (!gambiteo) {
            return next(new HttpError(403, 'No existe.'))
        }
        if (gambiteo.propietario.toString() !== uid) {
            return next(new HttpError(403, 'No tienes permiso para hacer esto tunante.'))
        }

        gambiteo.titulo = titulo;
        gambiteo.descripcion = descripcion

        let imgToDelete
        if (img) {
            imgToDelete = gambiteo.img
            gambiteo.img = img
        }
        gambiteo.participantes = participantesToSave
        gambiteo.campos = camposToSave

        await gambiteo.save();

        if (imgToDelete) {
            deleteImage(imgToDelete)
        }

        res.json(gambiteo.toObject({ getters: true }));
    } catch (error) {
        console.error('Error en editGambiteo():', error)
        return next(new Http500Error(error))
    }
}

const deleteGambiteo = async (req, res, next) => {
    try {
        const uid = req.userData.uid;
        const gid = req.params.gambiteoId;

        const gambiteo = await Gambiteo.findById(gid)
        if (gambiteo.propietario.toString() !== uid) {
            return next(new HttpError(403, 'No tienes permiso para hacer esto tunante.'))
        }

        await Message.deleteMany({ gambiteo: gambiteo })
        await gambiteo.delete()

        res.json(gid);

    } catch (error) {
        console.error('Error en deleteGambiteo():', error)
        return next(new Http500Error(error))
    }
}

const votar = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        const { gambiteoId, campoId, opcionId } = req.body;

        // Recuperamos el gambiteo de BBDD por su id
        const gambiteo = await Gambiteo.findById(gambiteoId)

        // Controlamos que exista y que el usuario participe en el
        if (!gambiteo) {
            return next(new HttpError(404, 'Gambiteo no encontrado.'))
        }
        if (!gambiteo.participantes.includes(uid)) {
            return next(new HttpError(403, 'Este gambiteo no es para ti tunante.'))
        }

        // Buscamos el campo en el que se esta votando
        const campo = gambiteo.campos.find(c => c._id.toString() === campoId);

        // Eliminamos los posibles votos previos del usuario en dicho campo
        for (const val of campo.valores) {
            val.votos = val.votos.filter(v => v._id.toString() !== uid)
        }

        // Guardamos el voto nuevo
        const opcion = campo.valores.find(val => val._id.toString() === opcionId)
        opcion.votos.push(uid)

        await gambiteo.save();

        res.status(201).json(gambiteo.toObject({ getters: true }))

    } catch (error) {
        console.error('Error en votar():', error)
        return next(new Http500Error(error))
    }
}

const confirmar = async (req, res, next) => {
    try {
        const uid = req.userData.uid;
        const { gambiteoId, campoId, confirmacion: valorConfirmacion } = req.body;

        // Recuperamos el gambiteo de BBDD por su id
        const gambiteo = await Gambiteo.findById(gambiteoId)

        // Controlamos que exista y que el usuario participe en el
        if (!gambiteo) {
            return next(new HttpError(404, 'Gambiteo no encontrado.'))
        }
        if (!gambiteo.participantes.includes(uid)) {
            return next(new HttpError(403, 'Este gambiteo no es para ti tunante.'))
        }

        // Buscamos el campo en el que se esta confirmando
        const campo = gambiteo.campos.find(c => c._id.toString() === campoId);

        const confirmaciones = campo.valores[0].confirmaciones

        // Miramos si el usuario ya habia confirmado previamente y lo modificamos
        let hayConfirmacionPrevia = false;
        for (const confir of confirmaciones) {
            if (confir.user._id.toString() === uid) {
                hayConfirmacionPrevia = true
                confir.confirmacion = valorConfirmacion
                break
            }
        }

        // Si no se habia confirmado previamente guardamos una confirmacion nueva
        if (!hayConfirmacionPrevia) {
            confirmaciones.push({
                confirmacion: valorConfirmacion,
                user: uid
            })
        }

        await gambiteo.save();

        await Gambiteo.populate(gambiteo, { path: 'campos.confirmaciones.user', select: 'nombre username img' })

        res.status(201).json(gambiteo.toObject({ getters: true }))

    } catch (error) {
        console.error('Error en confirmar():', error)
        return next(new Http500Error(error))
    }
}

const invitar = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        const { gambiteoId, amigosIds } = req.body;

        const gambiteo = await Gambiteo.findById(gambiteoId)

        const participantes = gambiteo.participantes.map(p => p.toString())

        const nuevosParticipantes = amigosIds.filter(a => a !== uid && !participantes.includes(a))

        gambiteo.participantes.push(...nuevosParticipantes)

        await gambiteo.save();

        ExpoUtil.notificationsesInvitacionGambiteo(nuevosParticipantes, gambiteo._id)

        await Gambiteo.populate(gambiteo, { path: 'participantes', select: 'nombre username img' })

        res.json(gambiteo.toObject({ getters: true }))

    } catch (error) {
        console.error('Error en invitar():', error)
        return next(new Http500Error(error))
    }
}

exports.feed = feed;
exports.getById = getById;
exports.createGambiteo = createGambiteo;
exports.editGambiteo = editGambiteo;
exports.deleteGambiteo = deleteGambiteo;
exports.votar = votar;
exports.confirmar = confirmar;
exports.invitar = invitar;
