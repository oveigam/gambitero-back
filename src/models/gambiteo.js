const mongoose = require('mongoose');
const mongoose_delete = require('mongoose-delete');

const Schema = mongoose.Schema;

const gambiteoSchema = new Schema({
    titulo: { type: String, required: true },
    img: { type: String, required: false },
    propietario: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    participantes: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    campos: [
        {
            asunto: { type: String, required: true },
            tipoCampo: { type: String, required: true },
            tipoDato: { type: String, required: true },
            valores: [
                {
                    valor: { type: String, required: true },
                    votos: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
                    confirmaciones: [
                        {
                            confirmacion: { type: Boolean, required: true },
                            user: { type: mongoose.Types.ObjectId, ref: 'User' }
                        }
                    ],
                }
            ],
            presetId: { type: Number, required: false },
        }
    ],
    lastMsgTimestamp: { type: Date, required: false },
},
    { timestamps: true }
)

gambiteoSchema.plugin(mongoose_delete, { overrideMethods: true })
// gambiteoSchema.plugin(mongoose_delete, { overrideMethods: ['count', 'findById', 'find', 'findOne', 'findOneAndUpdate', 'update'] })

module.exports = mongoose.model('Gambiteo', gambiteoSchema);