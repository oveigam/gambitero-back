const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Gambiteo = require('../models/gambiteo');
const Message = require('../models/message');
const RefreshToken = require('../models/refresh-token');


class Demo {

    async clearDatabase() {
        console.log('Clearing database')
        await Promise.all([
            User.deleteMany({}),
            Gambiteo.deleteMany({}),
            Message.deleteMany({}),
            RefreshToken.deleteMany({}),
        ])
        console.log('Datbase cleared')
    }

    async insertFakeData() {
        console.log('Inserting fake data')

        const hashedPassword = await bcrypt.hash('gambitero', 12);

        const user1 = new User({
            username: 'ilovegambitero',
            email: 'fake1@mail.com',
            password: hashedPassword,
            img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Heart_coraz%C3%B3n.svg/130px-Heart_coraz%C3%B3n.svg.png',
            nombre: 'I <3 Gambitero',
            gambiteos: [],
            notificacionesConfig: {
                nuevoGambiteo: false,
                solicitudAmistad: false,
                chat: false,
            }
        })

        const user2 = new User({
            username: 'oveigam',
            email: 'fake2@mail.com',
            password: hashedPassword,
            img: 'https://media.istockphoto.com/photos/hes-a-handsome-man-picture-id180841365?s=612x612',
            nombre: 'Óscar',
            gambiteos: [],
            notificacionesConfig: {
                nuevoGambiteo: false,
                solicitudAmistad: false,
                chat: false,
            }
        })

        const user3 = new User({
            username: 'miro',
            email: 'fake3@mail.com',
            password: hashedPassword,
            img: 'https://static2.abc.es/media/espana/2018/08/06/ernesto2-k2qD--620x349@abc.jpg',
            nombre: 'Miro Pereira',
            gambiteos: [],
            notificacionesConfig: {
                nuevoGambiteo: false,
                solicitudAmistad: false,
                chat: false,
            }
        })

        const user4 = new User({
            username: 'bean',
            email: 'fake4@mail.com',
            password: hashedPassword,
            img: 'https://i0.wp.com/media.ghgossip.com/wp-content/uploads/2021/02/05170404/Rowan_Atkinson.jpg?fit=885%2C516&ssl=1',
            nombre: 'Mr. Bean',
            gambiteos: [],
            notificacionesConfig: {
                nuevoGambiteo: false,
                solicitudAmistad: false,
                chat: false,
            }
        })

        const user5 = new User({
            username: 'mantis',
            email: 'fake5@mail.com',
            password: hashedPassword,
            img: 'https://pbs.twimg.com/media/EQByCzMU4AEi48M.jpg',
            nombre: 'Dr. Mantis Toboggan',
            gambiteos: [],
            notificacionesConfig: {
                nuevoGambiteo: false,
                solicitudAmistad: false,
                chat: false,
            }
        })

        const user6 = new User({
            username: 'mrajoy',
            email: 'fake6@mail.com',
            password: hashedPassword,
            img: 'https://previews.123rf.com/images/lopolo/lopolo1810/lopolo181004194/112664582-70-year-old-senior-man-standing-isolated-on-white-background.jpg',
            nombre: 'Manuel Rajoy',
            gambiteos: [],
            notificacionesConfig: {
                nuevoGambiteo: false,
                solicitudAmistad: false,
                chat: false,
            }
        })

        await user1.save()
        await user2.save()
        await user3.save()
        await user4.save()
        await user5.save()
        await user6.save()

        user1.amigos = [
            { user: user2.id, status: 'accepted' },
            { user: user3.id, status: 'accepted' },
            { user: user4.id, status: 'accepted' },
            { user: user5.id, status: 'accepted' },
            { user: user6.id, status: 'accepted' },
        ]

        user2.amigos = [
            { user: user1.id, status: 'accepted' },
            { user: user3.id, status: 'accepted' },
            { user: user4.id, status: 'accepted' },
            { user: user5.id, status: 'accepted' },
            { user: user6.id, status: 'accepted' },
        ]

        user3.amigos = [
            { user: user1.id, status: 'accepted' },
            { user: user2.id, status: 'accepted' },
            { user: user4.id, status: 'accepted' },
            { user: user5.id, status: 'accepted' },
            { user: user6.id, status: 'accepted' },
        ]

        user4.amigos = [
            { user: user1.id, status: 'accepted' },
            { user: user2.id, status: 'accepted' },
            { user: user3.id, status: 'accepted' },
            { user: user5.id, status: 'accepted' },
            { user: user6.id, status: 'accepted' },
        ]

        user5.amigos = [
            { user: user1.id, status: 'accepted' },
            { user: user2.id, status: 'accepted' },
            { user: user3.id, status: 'accepted' },
            { user: user4.id, status: 'accepted' },
            { user: user6.id, status: 'accepted' },
        ]

        user6.amigos = [
            { user: user1.id, status: 'accepted' },
            { user: user2.id, status: 'accepted' },
            { user: user3.id, status: 'accepted' },
            { user: user4.id, status: 'accepted' },
            { user: user5.id, status: 'accepted' },
        ]

        await user1.save()
        await user2.save()
        await user3.save()
        await user4.save()
        await user5.save()
        await user6.save()

        const gambiteo1 = new Gambiteo({
            titulo: 'Cumpleaños Manolete',
            img: 'https://i.insider.com/5a441d568ba892cf1c8b45b3?width=700',
            propietario: user1.id,
            participantes: [user1.id, user2.id, user3.id, user4.id, user5.id, user6.id],
            campos: [
                {
                    asunto: 'Descripción',
                    tipoCampo: 'info',
                    tipoDato: 'texto',
                    valores: [{ valor: 'Vamos a darle una fiesta sorpresa a Manolete por su cumpleaños!!' }],
                    presetId: 1,
                },
                {
                    asunto: 'Asistencia',
                    tipoCampo: 'confirmacion',
                    tipoDato: 'texto',
                    valores: [{ valor: '¿Te apuntas?' }],
                    presetId: 2,
                },
                {
                    asunto: 'Fecha',
                    tipoCampo: 'info',
                    tipoDato: 'fecha',
                    valores: [{ valor: '2021-11-14T14:10:10.673Z' }],
                    presetId: 3,
                },
                {
                    asunto: 'Hora',
                    tipoCampo: 'info',
                    tipoDato: 'hora',
                    valores: [{ valor: '2021-08-31T20:00:44.500Z' }],
                    presetId: 4,
                },
                {
                    asunto: 'Lugar',
                    tipoCampo: 'info',
                    tipoDato: 'texto',
                    valores: [{ valor: 'Casa de manolete' }],
                    presetId: 5,
                },
            ],
        })

        const gambiteo2 = new Gambiteo({
            titulo: 'Vacaciones Semana Santa',
            img: 'https://infovaticana.com/wp-content/uploads/2020/03/procesion-1.jpg',
            propietario: user1.id,
            participantes: [user1.id, user2.id, user3.id, user4.id, user5.id, user6.id],
            campos: [
                {
                    asunto: 'Descripción',
                    tipoCampo: 'info',
                    tipoDato: 'texto',
                    valores: [{ valor: 'Hay que organizarse para irse de vacaciones a ver alguna procesión' }],
                    presetId: 1,
                },
                {
                    asunto: 'Asistencia',
                    tipoCampo: 'confirmacion',
                    tipoDato: 'texto',
                    valores: [{ valor: '¿Te apuntas?' }],
                    presetId: 2,
                },
                {
                    asunto: 'Fecha',
                    tipoCampo: 'opcion',
                    tipoDato: 'fecha',
                    valores: [
                        {
                            valor: "2022-04-08T20:09:30.286Z",
                            votos: [user1.id, user2.id]
                        },
                        {
                            valor: "2022-04-09T20:09:30.286Z",
                            votos: [user5.id, user6.id]
                        },
                    ],
                    presetId: 3,
                },
                {
                    asunto: 'Lugar',
                    tipoCampo: 'opcion',
                    tipoDato: 'texto',
                    valores: [
                        {
                            valor: "Sevilla",
                            votos: [user4.id, user2.id]
                        },
                        {
                            valor: "Malaga",
                            votos: [user1.id]
                        },
                        {
                            valor: "Aragón",
                            votos: [user3.id, user6.id, user5.id]
                        },
                    ],
                    presetId: 5,
                },
                {
                    asunto: '¿Quien puede poner coche?',
                    tipoCampo: 'confirmacion',
                    tipoDato: 'texto',
                    valores: [
                        {
                            valor: 'Necesitamos 2',
                            confirmaciones: [
                                {
                                    confirmacion: true,
                                    user: user4.id
                                },
                                {
                                    confirmacion: false,
                                    user: user3.id
                                },
                                {
                                    confirmacion: true,
                                    user: user2.id
                                },
                                {
                                    confirmacion: true,
                                    user: user1.id
                                }
                            ]
                        }
                    ],
                },
            ],
        })

        await gambiteo1.save()
        await gambiteo2.save()

        user1.gambiteos = [gambiteo1.id, gambiteo2.id]
        user2.gambiteos = [gambiteo1.id, gambiteo2.id]
        user3.gambiteos = [gambiteo1.id, gambiteo2.id]
        user4.gambiteos = [gambiteo1.id, gambiteo2.id]
        user5.gambiteos = [gambiteo1.id, gambiteo2.id]
        user6.gambiteos = [gambiteo1.id, gambiteo2.id]

        await user1.save()
        await user2.save()
        await user3.save()
        await user4.save()
        await user5.save()
        await user6.save()

        console.log('Fake data inserted')
    }

}

module.exports = Demo