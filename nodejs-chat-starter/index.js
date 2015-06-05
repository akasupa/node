let path = require('path')
let express = require('express')
let morgan = require('morgan')

let App = require('./app/app')
let config = requireDir('./config', {recurse: true})
let port = process.env.PORT || 8000
let app = new App(config)

const NODE_ENV = process.env.NODE_ENV || 'development'

app.initialize(port)
      .then(()=> console.log(`Listening @ http://127.0.0.1:${port}`))
      // ALWAYS REMEMBER TO CATCH!
      .catch(e => console.log(e.stack ? e.stack : e))
