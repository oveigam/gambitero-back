const mongoose = require('mongoose');
const friendsRealtime = require('../realtime/friends-realtime');
const gambiteosRealtime = require('../realtime/gambiteos-realtime');
const messagesRealtime = require('../realtime/messages-realtime');

class Database {

    constructor() {
        this.databaseUrl = process.env.DATABASE
        this.connectionOptions = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }
    }

    async connect() {
        await mongoose.connect(this.databaseUrl, this.connectionOptions)
        console.log('Database conected')
    }

    enableRealTime() {
        gambiteosRealtime()
        friendsRealtime()
        messagesRealtime()
    }

}

module.exports = Database