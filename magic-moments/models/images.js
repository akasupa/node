let mongoose = require('mongoose')
require("songbird")

let imagesSchema = mongoose.Schema({
    groupId: {
        type: String,
        required: true
    },
    imageId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    addedBy: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        required: true
    },
    imageData: {
        data: Buffer,
        contentType: String
    }
})
imagesSchema.virtual('imageDataUri').get(function () {
    if (!this.image) return null
    let datauri = new DataUri()
    let imageDataUri = datauri.format('.' + this.image.contentType.split('/').pop(), this.image.data)
    return `data:${this.image.contentType};base64,${imageDataUri.base64}`
})

module.exports = mongoose.model('images', imagesSchema)