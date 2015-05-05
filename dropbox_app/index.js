let express = require('express')
let morgan = require('morgan')
let nodeify = require('bluebird-nodeify')
let path = require('path')
let fs = require('fs')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let argv = require('yargs').argv
let net = require('net')
let JsonSocket = require('json-socket')

require('songbird')

const NODE_ENV = process.env.NODE_ENV || 'development'
const PORT = process.env.PORT || 8000
const ROOT_DIR = argv.dir ? argv.dir : path.resolve(process.cwd())
const TCP_PORT = argv.tcpPort || 9000

let app = express()

if(NODE_ENV === 'development') {
	app.use(morgan('dev'))
}


let tcpSocket = null
let tcpServer = net.createServer()
console.log('Created TCP Server')

tcpServer.listen(TCP_PORT, () => console.log(`TCP server listening on @ http://127.0.0.1:${TCP_PORT}`))

tcpServer.on('connection', function(socket) {
    tcpSocket = new JsonSocket(socket)
    console.log('CONNECTED: ' + socket.remoteAddress + ':' + socket.remotePort)
    tcpSocket.on('message', function(message) {
        console.log('Received message from ' + socket.remoteAddress + ': ' + message)
    })
})

app.listen(PORT, ()=> console.log(`Listening  @ http://127.0.0.1: ${PORT}`))

app.get('*', setFileMeta, sendHeaders, (req, res) => { 
	if(res.body) {
		res.json(res.body)
		return
	}
	
	fs.createReadStream(req.filePath).pipe(res)
})

app.head('*', setFileMeta, sendHeaders, (req, res)=> res.end())

app.delete('*', setFileMeta, (req, res, next)=> {
	async ()=> {
		if(!req.stat) {
			res.status(400).send('Invalid path to del')
			return
		}
		if(req.stat.isDirectory()) {
			await rimraf.promise(req.filePath)
		}
		else {
			await fs.promise.unlink(req.filePath)
		}
		res.end()

		if (req.isDir) {
			publishChange('delete', 'dir', req.url, null)
		} else {
			publishChange('delete', 'file', req.url, null)
		}
	}().catch(next)
})

app.put('*', setFileMeta, setDirDetails, (req, res, next)=> {
	async ()=>{
		if(req.stat) {
			return res.status(405).send('File Exists')
		}
		await mkdirp.promise(req.dirPath)

		if(!req.isDir) {
			req.pipe(fs.createWriteStream(req.filePath))
		}
		res.end()

		if (req.isDir) {
			publishChange('create', 'dir', req.url, null)
		} else {
			fs.promise.readFile(req.filePath)
			.then(data => {
				publishChange('create', 'file', req.url, data.toString())
			})
			.catch(e => console.log(e.stack))
		}
	}().catch(next)
})

app.post('*', setFileMeta, setDirDetails, (req, res, next)=> {
	async ()=>{
		if(!req.stat) {
			return res.status(405).send('File does not exist')
		}
		if(req.isDir) {
			return res.status(405).send('Path is a directory')
		}
		await fs.promise.truncate(req.filePath, 0)

		if(!req.isDir) {
			req.pipe(fs.createWriteStream(req.filePath))
		}
		res.end()

		fs.promise.readFile(req.filePath)
		.then(content => {
			publishChange('update', 'file', req.url, content.toString())
		})

	}().catch(next)
})


function setDirDetails(req, res, next) {

	let endsWithSlash = req.filePath.charAt(req.filePath.length-1) === path.sep
	let hasExt = path.extname(req.filePath) !== ''
	req.isDir = endsWithSlash || !hasExt
	req.dirPath = req.isDir ? filePath : path.dirname(req.filePath)
	next()
}

function setFileMeta(req, res, next) {
	req.filePath = path.resolve(path.join(ROOT_DIR, req.url))
	
	if(req.filePath.indexOf(ROOT_DIR) !== 0 ) {
		res.status(400).send('Invalid path')
		return
	}
	fs.promise.stat(req.filePath)
		.then(stat => req.stat = stat, ()=> req.stat = null)
		.nodeify(next)
}

function sendHeaders(req, res, next) {
	nodeify(async ()=> {

		if (req.stat.isDirectory()) {
			let files = await fs.promise.readdir(req.filePath)
			res.body = JSON.stringify(files);
			res.setHeader('Content-Length', res.body.length)
			res.setHeader('Content-Type', 'application/json')
			return
		}

		res.setHeader('Content-Length', req.stat.size)
		let contentType = mime.contentType(path.extname(req.filePath))
		res.setHeader('Content-Type', contentType)
	}(), next)	
}

function publishChange(action, type, path, content) {
	if (!tcpSocket) {
		console.log('No clients available to sync')
		return
	}
	let actionMessage = {
		"action": action,
		"type": type,
    	"path": path,
    	"content": content,
    	"timestamp": Date.now()
	}
	tcpSocket.sendMessage(actionMessage, err => {
		if (err) {
			console.log(err)
		}
	})
	console.log('Message sent to the client:\n ' + JSON.stringify(actionMessage))
}