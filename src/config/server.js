const express = require('express');
const http = require('http');

const Database = require('./database');
const Sockets = require('./sockets');
const Demo = require('./demo');

const gambiteosRouter = require('../routes/gambiteos-routes')
const usersRouter = require('../routes/users-routes')
const friendsRouter = require('../routes/friends-routes')
const messagesRouter = require('../routes/messages-routes')

const handleUnknownRoute = require('../middleware/unknown-route-handler')
const handleErrors = require('../middleware/error-handler');

class Server {

    constructor() {

        this.app = express()
        this.app.setMaxListeners(0)

        this.server = http.createServer(this.app)
        this.port = process.env.PORT || 5000

        this.database = new Database()

        this.sockets = new Sockets(this.server)

        this.demo = new Demo()

    }

    useMiddlewares() {
        // Parseador de request a json
        this.app.use(express.json())

        // Routers de la REST-API
        this.app.use('/api/gambiteos', gambiteosRouter)
        this.app.use('/api/users', usersRouter)
        this.app.use('/api/friends', friendsRouter);
        this.app.use('/api/messages', messagesRouter);

        // Gestionar rutas desconocidas
        this.app.use(handleUnknownRoute)

        // Gestionar errores
        this.app.use(handleErrors)
    }

    async init() {
        this.useMiddlewares()

        await this.database.connect()
        
        await this.demo.clearDatabase()
        await this.demo.insertFakeData()

        this.sockets.startListening()

        this.database.enableRealTime()
        
        this.server.listen(this.port, () => {
            console.log('Server online on port:', this.port)
        })
    }

}

module.exports = Server