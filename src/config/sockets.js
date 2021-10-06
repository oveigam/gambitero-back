const socketio = require('socket.io');
const checkAuthSocket = require('../middleware/check-auth-socket');

class Sockets {

    constructor(server) {
        Sockets.io = socketio(server)
        Sockets.io.use(checkAuthSocket)
    }

    startListening() {
        Sockets.io.on('connection', async (socket) => {
            console.log('socket coneccted', socket.id, 'from user', socket.uid)

            const uid = socket.uid

            socket.join(uid)

            socket.on('subscribe', ({ type }) => {
                const room = type + '/' + uid
                socket.join(room)
                console.log('-> user', socket.uid, 'joined', room)
            })

            socket.on('unsubscribe', ({ type }) => {
                const room = type + '/' + uid
                socket.leave(room)
                console.log('<- user', socket.uid, 'left', room)
            })

            socket.on('disconnect', () => {
                console.log('      socket disconeccted', socket.id)
            })

            socket.emit('server-connection')
        })
    }

}

module.exports = Sockets