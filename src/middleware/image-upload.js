const aws = require('ibm-cos-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')
const fileName = require('../util/fileName')
const getKeyFromFileName = require('../util/getKeyFromFileName')

const s3Config = new aws.S3({
    endpoint: process.env.S3_ENDPOINT,
    apiKeyId: process.env.S3_API_KEY,
    ibmAuthEndpoint: process.env.IBM_AUTH_ENDPOINT,
    serviceInstanceId: process.env.SERVICE_INSTANCE_ID,
})

const multerS3Config = multerS3({
    s3: s3Config,
    bucket: process.env.IMG_BUCKET,
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        cb(null, fileName(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

exports.imageUpload = multer({
    storage: multerS3Config,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // we are allowing only 5 MB files
    }
});

exports.deleteImage = async (url) => {
    try {
        await s3Config.deleteObject({
            Bucket: process.env.IMG_BUCKET,
            Key: getKeyFromFileName(url)
        }).promise()
    } catch (error) {
        console.error('ERROR BORRANDO IMAGEN EN S3', img)
    }
}