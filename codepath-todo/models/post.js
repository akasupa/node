// post.js
let mongoose = require('mongoose')

require('songbird')

let PostSchema = mongoose.Schema({
	title: {
		type:String,
		required: true
	},
    content: {
		type:String,
		required: true
	},
    image: {
		data:Buffer,
		contentType: String
	},
	createDate: Date,
	updateDate: Date
})

module.exports = mongoose.model('Post', PostSchema)