let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser')
let session = require('express-session')
let passport = require('passport')
//let express = require('express')
let morgan = require('morgan')
let flash = require('connect-flash')
let mongoose = require('mongoose')
let passportMiddleware = require('./middleware/passport')
let routes = require('./routes')
let express = require('express.io')

require('songbird')

const PORT = process.env.PORT || 9090
const NODE_ENV = process.env.NODE_ENV || 'development'

let app = express().http().io()
app.passport = passport

app.use(morgan('dev'))

// And add the following just before app.listen
// Use ejs for templating, with the default directory /views
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/views/public'));

// Read cookies, required for sessions
app.use(cookieParser('ilovethenodejs'))           

// Get POST/PUT body information (e.g., from html forms like login)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// In-memory session support, required by passport.session()
app.use(session({
  secret: 'ilovethenodejs',
  resave: true,
  saveUninitialized: true
}))

// Use the passport middleware to enable passport
app.use(passport.initialize())

// Enable passport persistent sessions
app.use(passport.session())

app.use(flash()) 

passportMiddleware(app)
routes(app)

// connect to mongodb
mongoose.connect('mongodb://127.0.0.1:27017/magic-moments')

// start server 
app.listen(PORT, ()=> console.log(`Listening @ http://127.0.0.1:${PORT}`))