// comment.js
let mongoose = require('mongoose')

let CommentSchema = mongoose.Schema({
    username: {
		type:String,
		required: true
	},
	comment: {
		type:String,
		required: true
	},
	postId: String,
	createDate: Date,
	updateDate: Date
})

module.exports = mongoose.model('Comment', CommentSchema)