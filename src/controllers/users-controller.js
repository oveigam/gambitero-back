const bcrypt = require('bcryptjs');

const HttpError = require("../errors/http-error");
const Http500Error = require("../errors/http-500-error");
const tokenManager = require('../security/token-manager');
const User = require('../models/user');
const RefreshToken = require('../models/refresh-token');
const { deleteImage } = require('../middleware/image-upload');
const moment = require('moment');

const signUp = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Comprobamos que el usuario no exista ya
        const existingUser = await User.findOne({ email: email })
        if (existingUser) {
            return next(new HttpError(422, 'El usuario ya existe'))
        }

        // Encriptamos la password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Guardamos el usuario en la BBDD
        const createdUser = new User({
            username,
            email,
            password: hashedPassword,
            nombre: username,
            gambiteos: [],
            notificacionesConfig: {
                nuevoGambiteo: true,
                solicitudAmistad: true,
                chat: true,
            }
        })
        await createdUser.save();

        // Generamos los token para el usuario
        const token = await tokenManager.generateToken(createdUser.id);
        const refreshToken = await tokenManager.generateRefreshToken(createdUser.id);

        // Guardamos el registro del refresh token en DB para poder invalidarlo en el futuro de ser necesario
        new RefreshToken({ uid: createdUser.id, token: refreshToken }).save()

        // Retornamos la info basica del usuario y los tokens de acceso
        res.status(201).json({
            userData: {
                uid: createdUser.id,
                username: createdUser.username,
                email: createdUser.email,
                nombre: createdUser.nombre,
                notificacionesConfig: createdUser.notificacionesConfig
            },
            token: token,
            refreshToken: refreshToken
        })
    } catch (error) {
        console.error('Error en signUp():', error)
        return next(new Http500Error(error))
    }
}

const login = async (req, res, next) => {
    try {
        const { usernameOrEmail, password } = req.body;

        // Comprobamos que el usuario existe
        const existingUser = await User.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] })
        if (!existingUser) {
            return next(new HttpError(422, 'El usuario no existe.'))
        }

        let isValidPassword = await bcrypt.compare(password, existingUser.password);
        if (!isValidPassword) {
            return next(new HttpError(422, 'Contraseña incorrecta'))
        }

        // Generamos los token para el usuario
        const token = await tokenManager.generateToken(existingUser.id);
        const refreshToken = await tokenManager.generateRefreshToken(existingUser.id);

        // Guardamos el registro del refresh token en DB para poder invalidarlo en el futuro de ser necesario
        new RefreshToken({ uid: existingUser.id, token: refreshToken }).save()

        // Retornamos la info basica del usuario y los tokens de acceso
        res.status(201).json({
            userData: {
                uid: existingUser.id,
                username: existingUser.username,
                email: existingUser.email,
                nombre: existingUser.nombre,
                img: existingUser.img,
                notificacionesConfig: existingUser.notificacionesConfig
            },
            token: token,
            refreshToken: refreshToken
        })
    } catch (error) {
        console.error('Error en login():', error)
        return next(new Http500Error(error))
    }
}

const refreshLogin = async (req, res, next) => {
    try {
        // Decodificamos el token de acceso del header (que presuntamente esta expirado)
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = tokenManager.decodeToken(token);

        // Decodificamos el refresh token enviado en el cuerpo
        const { refreshToken } = req.body;
        const decodedRefToken = await tokenManager.verifyRefreshToken(refreshToken)

        // Comprobamos que ambos token son del mismo usuario
        const tokenUid = decodedToken.uid;
        const refTokenUid = decodedRefToken.uid;
        if (tokenUid !== refTokenUid) {
            return next(new HttpError(403, 'Error validando al usuario.'))
        }

        // Comprobamos que tenemos un registro en BBDD del refresh token (osea, que no se revoco el acceso)
        const refTokenDB = await RefreshToken.findOne({ uid: refTokenUid, token: refreshToken })
        if (!refTokenDB) {
            return next(new HttpError(403, 'Error validando al usuario.'))
        }

        const user = await User.findById(refTokenUid)
        if (!user) {
            return next(new HttpError(403, 'Error validando al usuario.'))
        }

        // Generamos un nuevo token 
        const newToken = await tokenManager.generateToken(refTokenUid);

        // Retornamos la info basica del usuario y el token refrescado
        res.json({
            userData: {
                uid: user.id,
                username: user.username,
                email: user.email,
                nombre: user.nombre,
                img: user.img,
                notificacionesConfig: user.notificacionesConfig
            },
            token: newToken,
        })

    } catch (error) {
        console.error('Error en refreshToken():', error)
        return next(new Http500Error(error))
    }
}

const refreshToken = async (req, res, next) => {
    try {
        // Decodificamos el token de acceso del header (que presuntamente esta expirado)
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = tokenManager.decodeToken(token);

        // Decodificamos el refresh token enviado en el cuerpo
        const { refreshToken } = req.body;
        const decodedRefToken = await tokenManager.verifyRefreshToken(refreshToken)

        // Comprobamos que ambos token son del mismo usuario
        const tokenUid = decodedToken.uid;
        const refTokenUid = decodedRefToken.uid;
        if (tokenUid !== refTokenUid) {
            return next(new HttpError(403, 'Error validando al usuario.'))
        }

        // Comprobamos que tenemos un registro en BBDD del refresh token (osea, que no se revoco el acceso)
        const refTokenDB = await RefreshToken.findOne({ uid: refTokenUid, token: refreshToken })
        if (!refTokenDB) {
            return next(new HttpError(403, 'Error validando al usuario.'))
        }

        // Si todo es correcto generamos un nuevo token y lo enviamos al usuario
        const newToken = await tokenManager.generateToken(refTokenUid);
        res.json({ token: newToken })

    } catch (error) {
        console.error('Error en refreshToken():', error)
        return next(new Http500Error(error))
    }
}

const logout = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        await User.updateOne({ _id: uid }, { pushToken: null })

        await RefreshToken.deleteMany({ uid: uid })
        res.status(204).json({ deleted: true })
    } catch (error) {
        console.error('Error en logout():', error)
        return next(new Http500Error(error))
    }
}

const updateProfile = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        const { nombre, permisoNuevoGambiteo, permisoSolicitudAmistad, permisoChat } = req.body
        const img = req.file ? req.file.location : undefined;

        const user = await User.findById(uid)

        if (nombre && user.nombre !== nombre) {
            user.nombre = nombre;
        }

        let imgToDelete
        if (img && user.img !== img) {
            imgToDelete = user.img
            user.img = img;
        }

        user.notificacionesConfig.nuevoGambiteo = permisoNuevoGambiteo
        user.notificacionesConfig.solicitudAmistad = permisoSolicitudAmistad
        user.notificacionesConfig.chat = permisoChat

        await user.save()

        if (imgToDelete) {
            deleteImage(imgToDelete)
        }

        res.json({
            userData: {
                uid: user.id,
                username: user.username,
                email: user.email,
                nombre: user.nombre,
                img: user.img,
                notificacionesConfig: user.notificacionesConfig
            },
        })

    } catch (error) {
        console.error('Error en updateProfile():', error)
        return next(new Http500Error(error))
    }
}

const setPushToken = async (req, res, next) => {
    try {
        const uid = req.userData.uid;
        const { pushToken } = req.body

        await User.updateOne({ _id: uid }, { pushToken: pushToken })

        res.status(201).json({})

    } catch (error) {
        console.error('Error en setPushToken():', error)
        return next(new Http500Error(error))
    }
}

const deletePushToken = async (req, res, next) => {
    try {
        const uid = req.userData.uid;

        await User.updateOne({ _id: uid }, { pushToken: null })

        res.status(200).json({})

    } catch (error) {
        console.error('Error en deletePushToken():', error)
        return next(new Http500Error(error))
    }
}

exports.silenciarChat = async (req, res, next) => {
    try {
        const gid = req.params.gambiteoId;
        const uid = req.userData.uid;
        const { tiempo } = req.body

        let silenced = true
        const fecha = moment()
        switch (tiempo) {
            case '8h':
                fecha.add(8, 'hours')
                break;

            case '1week':
                fecha.add(7, 'day')
                break;

            case 'forever':
                fecha.add(100, 'years')
                break;

            default:
                silenced = false
                break
        }

        const yo = await User.findById(uid)
        if (!yo.silencedChats) {
            yo.silencedChats = new Map();
        }
        yo.silencedChats.set(gid.toString(), fecha)
        await yo.save()

        res.status(200).json({ silenced: silenced })

    } catch (error) {
        console.error('Error en deletePushToken():', error)
        return next(new Http500Error(error))
    }
}

exports.signUp = signUp;
exports.login = login;
exports.refreshLogin = refreshLogin;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.updateProfile = updateProfile;
exports.setPushToken = setPushToken;
exports.deletePushToken = deletePushToken;