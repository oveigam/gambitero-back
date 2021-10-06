const Sockets = require("../config/sockets")
const User = require("../models/user")
const getOrderStatusAmigo = require("../util/getOrderStatusAmigo")

module.exports = () => {
    User.watch().on('change', async (change) => {

        const { operationType } = change

        switch (operationType) {

            case 'update':
                await notifyFriendStatusChange(change.documentKey._id, change.updateDescription.updatedFields)
                break

        }
    })
}

const notifyFriendStatusChange = async (uid, updatedFields) => {

    if (updatedFields.amigos || isFriendStatusUpdate(updatedFields)) {
        // Recuperamos nuestro usuario
        const user = await User.findById(uid).populate('amigos.user', 'nombre username img');

        // Filtramos los amigos que nos tienen ignorados y los ordenamos por status
        const amigos = user.amigos
            .filter(a => a.status !== 'ignored')
            .sort((a, b) => {
                const statusA = getOrderStatusAmigo(a.status);
                const statusB = getOrderStatusAmigo(b.status);
                return statusA - statusB;
            })
            .map(a => a.toObject({ getters: true }))

        const room = 'amigos/' + uid
        Sockets.io.to(room).emit('subscription/amigos', {
            type: 'amigos/change',
            payload: amigos
        })
    }
}

const amigosArrayRegex = /^amigos\.[0-9]+\.status$/
const amigosArrayRegex2 = /^amigos\.[0-9]/

function isFriendStatusUpdate(updatedFields) {
    for (var key in updatedFields) {
        if (key.match(amigosArrayRegex) || key.match(amigosArrayRegex2)) {
            return true;
        }
    }
    return false;
};
