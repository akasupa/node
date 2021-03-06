
class: center, middle

# Express

Building your first node.js server.

---

# Why not use `http`?

- Very low level
- No cookie handling or parsing
- No session support
- No routing
- No static file serving

---

# `http`: Example

```javascript
let http = require('http')


  








.
```

---

# `http`: Example

```javascript
let http = require('http')

let server = http.createServer((req, res) => {
  




})



server.listen(8000, '127.0.0.1')
```

---

# `http`: Example

```javascript
let http = require('http')

let server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'})
  let result = { version: '1.0.0' }
  res.end(JSON.stringify(result))


})



server.listen(8000, '127.0.0.1')
```

---

# `http`: Example

```javascript
let http = require('http')

let handler = (req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'})
  let result = { version: '1.0.0' }
  res.end(JSON.stringify(result))


})

let server = http.createServer(handler)

server.listen(8000, '127.0.0.1')
```

---

# `http`: Example

```javascript
let http = require('http')

let dispatcher = (req, res) => {
  switch(req.url) {
    case '/version': version(req, res); break;
    case '/user': user(req, res); break;
    default: notFound(req, res); break;
  }
})

let server = http.createServer(dispatcher)

server.listen(8000, '127.0.0.1')
```

---

# Express

### Why use a framework?
- Foundation fo collaboration & code reuse
- Battle tested: memory leaks, bugs, stability, debugging

### Why use Express?
- Simple REST API routing
- Massive middleware ecosystem ("There's a middleware for that")
- ~80% market-share

---

# Middleware

A function passed to `app.use()` or a route with the following signature:

```javascript
app.use((req, res, next) => {
  // Typically, either terminate the res with .end() or .send()
  // Or do something and then call next()
})
```

---

# Middleware: Examples

**Middleware are opt-in. Include what you want:**
- Static files: `express.static()`
- Logging: `morgan`
- Body parsing: `body-parser`
- Cookie parsing: `cookie-parser`
- Session handling: `express-session`
- Authentiction: `passport`
- etc...

---

# Middleware: Stack

**Middleware are ordered like an array:**

```javascript
let express = require('express')
let app = express()

// 1st in middleware stack
app.use((req, res, next) => {
  // Pass control to next middleware in stack
  if (req.url !== '/about') return next()
  res.end('About page')
})

// 2nd in middleware stack
app.use((req, res, next) => {
  res.end('Default page')
})

// 3rd in middleware stack
app.use((req, res, next) => {
  // NEVER CALLED since next was not called above
})

app.listen(8080, '127.0.0.1')
```

---

# Middleware: `body-parser`

```javascript
let express = require('express')
let app = express()




app.get('/user', user)



.
```

---

# Middleware: `body-parser`

```javascript
let express = require('express')
let app = express()
let bodyParser = require('body-parser')


app.use(bodyParser.text())
app.get('/user', user)



.
```

---

# Middleware: `body-parser`

```javascript
let express = require('express')
let app = express()
let bodyParser = require('body-parser')


app.use(bodyParser.text())
app.get('/user', user)

app.post('/user', (req, res) => {
  // use req.body to create new user
})
```

---

# Middleware: Custom

**Any function with signature: `(req, res, next) => {}`**
```javascript
app.use((req, res, next) => {
  res.setHeader('X-API-Version', '1.0.0')
  return next()
})

app.get('/user', user)
```

---

# Middleware: Basic Auth


*http://username:password@127.0.0.1:8000/user*

```javascript
let express = require('express')
let app = express()









app.get('/user', user)
```
---

# Middleware: Basic Auth


*http://username:password@127.0.0.1:8000/user*

```javascript
let express = require('express')
let app = express()



let validate = (username, password, callback) => {
  let result = (username === 'steve' && password === '12345')
  callback(null, result)
}


app.get('/user', user)
```

---

# Middleware: Basic Auth


*http://username:password@127.0.0.1:8000/user*

```javascript
let express = require('express')
let app = express()
let basicAuth = require('basic-auth-connect')
let auth = basicAuth(validate)

let validate = (username, password, callback) => {
  let result = (username === 'steve' && password === '12345')
  callback(null, result)
}


app.get('/user', user)
```

---

# Middleware: Basic Auth


*http://username:password@127.0.0.1:8000/user*

```javascript
let express = require('express')
let app = express()
let basicAuth = require('basic-auth-connect')
let auth = basicAuth(validate)

let validate = (username, password, callback) => {
  let result = (username === 'steve' && password === '12345')
  callback(null, result)
}

app.use(auth)
app.get('/user', user)
```

---

# Middleware: Basic Auth


*http://username:password@127.0.0.1:8000/user*

```javascript
let express = require('express')
let app = express()
let basicAuth = require('basic-auth-connect')
let auth = basicAuth(validate)

let validate = (username, password, callback) => {
  let result = (username === 'steve' && password === '12345')
  callback(null, result)
}


app.get('/user', auth, user)
```
---

# Express: Configuration

**Conditionally use middleware:**
```javascript
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')) // Verbose logging
}
```

---

# Express: Routing

```javascript
let express = require('express')
let app = express()







app.listen(8000)
```

---

# Express: Routing

```javascript
let express = require('express')
let app = express()

app.get('/version', (req, res) => {



})

app.listen(8000)
```

---

# Express: Routing

```javascript
let express = require('express')
let app = express()

app.get('/version', (req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'})
  let result = { version: '1.0.0' }
  res.end(JSON.stringify(result))
})

app.listen(8000)
```

---

# Express: Routing

```javascript
let express = require('express')
let app = express()

app.get('/version', (req, res) => {

  let result = { version: '1.0.0' }
  res.json(result)
})

app.listen(8000)
```

---

# Express: Parameters

```javascript


app.get('/user', (req, res) => {
  
  let user = { id: 1, name: 'John' }
  
  res.json(user)
})
```

---

# Express: Parameters

```javascript
let users = require('./users.json')

app.get('/user/:id', (req, res) => {
  
  let user = users[req.params.id]
  
  res.json(user)
})
```

---

# Express: Parameters

```javascript
let users = require('./users.json')

app.get('/user/:id', (req, res) => {
  
  let user = users[req.params.id]
  if (!user) return res.send(404, 'Not Found')
  res.json(user)
})
```

---

# Express: Parameters

```javascript
let users = require('./users.json')

app.get('/user/:id?', (req, res) => {
  if (!req.params.id) return res.json(users)
  let user = users[req.params.id]
  if (!user) return res.send(404, 'Not Found')
  res.json(user)
})
```

---

# Express: Sanitizing Parameters

```javascript
app.param(':userId', then(async (req, res, next, id) => {
  try {
    req.user = await User.get(id)
    next()
  } catch(e) {
    res.send(401, 'Unauthorized')
  }
}))

app.get('/user/:userId', (req, res) => {
  res.send('user id: ' + req.user.id)
})
```

---

# Middleware: Composition

**Redundant code...**

```javascript
app.get('/user/:id', then(async (req, res) => {
  let id = req.params.id
  let user = await User.get(id)
  res.send('user ' + user.name)
}))

app.put('/user/:id', then((req, res) => {
  let id = req.params.id
  let user = await User.get(id)
  user.update(req.body)
}))
```

---

# Middleware: Composition

**Refactored to use middleware:**

```javascript
let then = require('express-then')
let loadUser = then(async (req, res, next) => {
  let id = req.params.id
  let user = await User.get(id)
  req.user = user
})

// Reuse loadUser as a route middleware
app.get('/user/:id', loadUser, (req, res) => {
  res.send('user ' + req.user.name)
})

app.put('/user/:id', loadUser, (req, res) => {
  req.user.update(req.body)
})
```

---

# Middleware: Composition

**Composable route middleware**

```javascript
app.put('/user/:id', isAdmin, loadUser, (req, res) => {
  req.user.update(req.body)
})
```

**is cleaner than...**

```javascript
app.put('/user/:id', then(async (req, res, next) => {
  await isAdmin(req, res)
  let user = await loadUser(req, res)
  req.user.update(req.body)
}))
```

---

# Express: Rendering Views

```javascript
// Configure ejs view engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Render view
app.get('/user/:id', loadUser, (req, res) => {
  res.render('user_edit', {
    user: req.user,
    title: 'Edit User ' + req.user.username
  })
})
```

---

class: center, middle

# Questions?