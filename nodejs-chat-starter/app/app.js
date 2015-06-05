let routes = require('./routes')
let Server = require('http').Server
let io = require('socket.io')
let express = require('express')
let morgan = require('morgan')
let flash = require('connect-flash')
let browserify = require('browserify-middleware')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')
let MongoStore = require('connect-mongo')(session)
let mongoose = require('mongoose')
let requireDir = require('require-dir')
let path = require('path')

require('songbird');


// app/app.js
class App {
    constructor(config) {
        let app = this.app = express()
        this.port = process.env.PORT || 8000
               
        // set up our express middleware
        app.use(morgan('dev')) // log every request to the console
        app.use(cookieParser('ilovethenodejs')) // read cookies (needed for auth)
        app.use(bodyParser.json()) // get information from html forms
        app.use(bodyParser.urlencoded({ extended: true }))


        // connect to the database
        // mongoose.connect(app.config.database.url)
        var dirName = __dirname.substring(0,__dirname.lastIndexOf('/'));
        app.set('views', path.join(dirName, 'views'))
        app.set('view engine', 'ejs') // set up ejs for templating

        // required for passport
        app.use(session({
          secret: 'ilovethenodejs',
          store: new MongoStore({db: 'social-feeder'}),
          resave: true,
          saveUninitialized: true
        }))
        routes(this.app)


        browserify.settings({transform: ['babelify']})
        app.use('/js/index.js', browserify('./public/js/index.js'))
        this.server = Server(app)
        this.io = io(this.server)

         // And add some connection listeners:
        this.io.on('connection', socket => {
            console.log('a user connected')
            socket.on('disconnect', () => console.log('user disconnected'))
            socket.on('im', msg => {
                    // im received
                    console.log(msg)
                    // echo im back
                    this.io.emit('im', msg)
            })
       })

    }

    async initialize(port) {
        await this.server.promise.listen(port)
        // Return this to allow chaining
        return this
    }
}

module.exports = App;