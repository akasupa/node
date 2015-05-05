let argv = require('yargs').argv
let fs = require('fs')
let path = require('path')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')

let net = require('net')
let JsonSocket = require('json-socket')

require('songbird')

const ROOT_DIR = path.resolve(process.cwd())

let tcpServer = argv.tcpServer || '127.0.0.1'
let port = argv.port || 9000

let netSocket = new net.Socket()
let clientSocket = new JsonSocket(netSocket)
clientSocket.connect(port, tcpServer)
clientSocket.on('connect', function() {
    console.log("Connected to server " + tcpServer + ':' + port)
    
})

clientSocket.on('close', function() {
    console.log("Disconnected from server " + tcpServer + ':' + port)
})

clientSocket.on('message', function(actMsg) {
    console.log('Received message from server: \n' + JSON.stringify(actMsg))
    switch(actMsg.action ) {

        case 'create':
            performCreateAction(actMsg.path, actMsg.type, actMsg.content)
            break
        case 'update':
            if (actMsg.type === 'file') {
                updateFile(actMsg.path, actMsg.content)
            }
            else {
                console.log('Update on a dir is not possible')
            }
            break
        case 'delete':
            performDeleteAction(actMsg.path, actMsg.type)
            break
        default: console.log('Unsupported action. No action taken')

    }
})

async function performCreateAction(path, type, content) {
    let finalPath = path.resolve(path.join(ROOT_DIR, path))
    if(type === 'dir') {
        await mkdirp.promise(finalPath)
        console.log('Created directory: ' + finalPath)
    }
    else {
        let parentDir = path.dirname(finalPath)
        await mkdirp.promise(parentDir)
        fs.promise.writeFile(finalPath, content)
            .then(() => {
                console.log('Created file: ' + finalPath)
            })
            .catch(e => console.log('Error creating file' +e.stack))
    }
}

async function updateFile(fileRelPath, content) {
    let fileAbsPath = path.resolve(path.join(ROOT_DIR, fileRelPath))
    await fs.promise.truncate(fileAbsPath, 0)
    fs.promise.writeFile(fileAbsPath, content)
    .then(() => {
        console.log('Updated file: ' + fileAbsPath)
    })
    .catch(e => console.log(e.stack))
}

async function performDeleteAction(path, type) {
    let finalPath = path.resolve(path.join(ROOT_DIR, path))
    if(type === 'dir') {
        let dirAbsPath = path.resolve(path.join(ROOT_DIR, finalPath))
        await rimraf.promise(dirAbsPath)
        console.log('Deleted directory: ' + dirAbsPath)
    }
    else {
        let fileAbsPath = path.resolve(path.join(ROOT_DIR, finalPath))
        await fs.promise.unlink(fileAbsPath)
        console.log('Deleted file: ' + fileAbsPath)
    }
}