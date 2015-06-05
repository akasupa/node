// group.js
let mongoose = require('mongoose')

require('songbird')


let memberSchema = mongoose.Schema({
    email: String,
    viewed: {
		type: Boolean,
		default: false
	},
})


let GroupSchema = mongoose.Schema({
	name: {
		type:String,
		required: true
	},
    createdBy: {
		type:String,
		required: true
	},
	memberList: [memberSchema],
	createDate: Date,
	updateDate: Date
})

module.exports = mongoose.model('Group', GroupSchema)