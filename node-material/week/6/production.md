
class: center, middle

# Node.js in Production

For node.js stability, metrics and performance.

*https://github.com/CrabDude/slides/blob/master/production.html*
---

# Overview

**Topics to cover:**

- Stability
  - [`uncaughtException`](https://nodejs.org/docs/latest/api/all.html#all_event_uncaughtexception)
  - [`cluster`](https://nodejs.org/docs/latest/api/all.html#all_cluster) for multi-process support
  - [`pm2`](https://github.com/Unitech/pm2) daemon
- Tooling
  - [`babel`](https://babeljs.io/) compilation
  - [`eslint`](http://eslint.org/)
  - Logging with [`debug`](https://www.npmjs.com/package/debug)
  - [`npm shrinkwrap`](https://www.npmjs.com/doc/shrinkwrap.html)
- Performance
  - Event-loop blocking & monitoring
    - [`blocked`](https://www.npmjs.com/package/blocked)
    - [`event-loop-lag`](https://www.npmjs.com/package/event-loop-lag)
  - V8 heapdump analysis with Chrome & [`heapdump`](https://www.npmjs.com/package/idle-hands)

---

# Stability: `uncaughtException`

**Handle errors before they crash the process and exit.**

> Emitted when an exception bubbles all the way back to the event loop. If a listener is added for this exception, the default action (which is to print a stack trace and exit) will not occur.

- Listening on `uncaughtException` is like switching your jet from automatic to manual ejection. You are not responsible for calling `process.exit()`

https://nodejs.org/api/process.html#process_event_uncaughtexception

---

# Stability: `uncaughtException`

**Handle errors before they crash the process and exit.**

```javascript
process.on('uncaughtException', err => {
    console.log(err.stack)


    process.exit()



})
```

---

# Stability: `uncaughtException`

**Handle errors before they crash the process and exit.**

```javascript
process.on('uncaughtException', err => {
    console.log(err.stack)
    server.shutdown()

      .then(process.exit)



})
```

---

# Stability: `uncaughtException`

**Handle errors before they crash the process and exit.**

```javascript
process.on('uncaughtException', err => {
    console.log(err.stack)
    server.shutdown()
      .catch(err => console.log('Shut down error:\n', err.stack))
      .then(process.exit)

    // Hard exit.
    setTimeout(process.exit, 10000)
})
```

---

# Stability: `cluster`

**No threads? No problem.**

- Port sharing
- IPC, Inter-process communication
- Process lifecycle monitoring for restarts
- Load balancing

---

# Stability: `cluster`

**Example:**

```javascript
// index.js
let cluster = require('cluster')




















.
```

---

# Stability: `cluster`

**Example:**

```javascript
// index.js
let cluster = require('cluster')
let workers = require('os').cpus().length



















.
```

---

# Stability: `cluster`

**Example:**

```javascript
// index.js
let cluster = require('cluster')
let workers = require('os').cpus().length

// Setup Master
cluster.setupMaster({
    exec: "app.js",
    args: ['--verbose']
})













.
```

---

# Stability: `cluster`

**Example:**

```javascript
// index.js
let cluster = require('cluster')
let workers = require('os').cpus().length

// Setup Master
cluster.setupMaster({
    exec: "app.js",
    args: ['--verbose']
})

// Fork Workers
for (let i = 0; i < workers; i++) {
    cluster.fork()
}








.
```

---

# Stability: `cluster`

**Example:**

```javascript
// index.js
let cluster = require('cluster')
let workers = require('os').cpus().length

// Setup Master
cluster.setupMaster({
    exec: "app.js",
    args: ['--verbose']
})

// Fork Workers
for (let i = 0; i < workers; i++) {
    cluster.fork()
}

cluster.on('exit', (worker, code, signal) => {


})

cluster.on('online', (worker) => {

})
```

---

# Stability: `cluster`

**Example:**

```javascript
// index.js
let cluster = require('cluster')
let workers = require('os').cpus().length

// Setup Master
cluster.setupMaster({
    exec: "app.js",
    args: ['--verbose']
})

// Fork Workers
for (let i = 0; i < workers; i++) {
    cluster.fork()
}

cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)

})

cluster.on('online', (worker) => {
    console.log(`worker ${worker.process.pid} started`)
})
```

---

# Stability: `cluster`

**Example:**

```javascript
// index.js
let cluster = require('cluster')
let workers = require('os').cpus().length

// Setup Master
cluster.setupMaster({
    exec: "app.js",
    args: ['--verbose']
})

// Fork Workers
for (let i = 0; i < workers; i++) {
    cluster.fork()
}

cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
    cluster.fork()
})

cluster.on('online', (worker) => {
    console.log(`worker ${worker.process.pid} started`)
})
```

---

# Stability: PM2

**Use `pm2` for better process tooling.**

- Built-in clustering
- Log aggregation
- Process monitoring
- Process management

---

# Stability: PM2

**`pm2` commands:**

```bash
pm2 list              # List running pm2 application
```

![pm2 list](https://github.com/unitech/pm2/raw/master/pres/pm2-list.png)

---

# Stability: PM2

**`pm2` commands:**

```bash
pm2 start app -i max  # Start with maximum clustering

.
```

---

# Stability: PM2

**`pm2` commands:**

```bash
pm2 start app -i max  # Start with maximum clustering
pm2 stop app          # Stop
.
```

---

# Stability: PM2

**`pm2` commands:**

```bash
pm2 start app -i max  # Start with maximum clustering
pm2 stop app          # Stop
pm2 restart app       # Restart
```

---

# Stability: PM2

**`pm2` commands:**

```bash
pm2 describe app      # Show available process info
```

![pm2 list](https://github.com/unitech/pm2/raw/master/pres/pm2-monit.png)

---

# Stability: PM2

**`pm2` commands:**

```bash
pm2 monit             # Monitor (show logs) for applications
```

![pm2 list](https://github.com/unitech/pm2/raw/master/pres/pm2-logs.png)

Or view logs directly:

```bash
pm2 logs app          # Display logs for "app"
pm2 flush             # CLear all logs
```

---

# Stability: PM2

**`pm2` commands:**

```bash
pm2 reload app        # Restart cluster processes with 0ms downtime
```

---

# Tooling

**Different environments have different needs.**

- `babel`
- `npm shrinkwrap`
- `eslint`
- `debug`
- Long-stack traces

---

# Tooling: Transpilation (Babel)

**Pretranspile your code with `babel`:**

```bash
$ babel src --out-dir dist
```

Generate source-maps for non-production environments:

```bash
$ babel src --out-dir dist --source-maps
```

Run the transpiled code:

```bash
node dist/index.js
```

*Be sure to declare a `.babelrc` file at the root of your project.*

---

# Tooling: Transpilation (Babel)

**Toggle bootstrap file based on `NODE_ENV`:**

```javascript
//package.json
{
    "scripts": {
        "start": "nodemon --exec babel-node -- --stage 1 --optional strict -- index.js",


    }
}
```

---

# Tooling: Transpilation (Babel)

**Toggle bootstrap file based on `NODE_ENV`:**

```javascript
//package.json
{
    "scripts": {
        "start-dev": "nodemon --exec babel-node -- --stage 1 --optional strict -- index.js",


    }
}
```

---

# Tooling: Transpilation (Babel)

**Toggle bootstrap file based on `NODE_ENV`:**

```javascript
//package.json
{
    "scripts": {
        "start-dev": "nodemon --exec babel-node -- --stage 1 --optional strict -- index.js",
        "start-prod": "pm2 start index.js -i max"

    }
}
```

---

# Tooling: Transpilation (Babel)

**Toggle bootstrap file based on `NODE_ENV`:**

```javascript
//package.json
{
    "scripts": {
        "start-dev": "nodemon --exec babel-node -- --stage 1 --optional strict -- index.js",
        "start-prod": "pm2 start index.js -i max",
        "start": "[[ \"$NODE_ENV\" = \"production\" ]] && npm run start-prod || npm run start-dev"
    }
}
```

---

# Tooling: Transpilation (Babel)

**Toggle bootstrap file based on `NODE_ENV`:**

```javascript
//package.json
{
    "scripts": {
        "start-dev": "nodemon --exec babel-node -- --stage 1 --optional strict -- index.js",
        "start-prod": "pm2 start index.js -i max",
        "start": "[[ \"$NODE_ENV\" = \"production\" ]] && npm run start-prod || npm run start-dev"

    }
}
```

Run the server with `npm start` every time:

```bash
$ NODE_ENV=production npm start
```

---

# Tooling: Linting

**Lint code manually  before its checked in:**

```bash
// package.json
{
    "scripts": {
        "test": "eslint ./ && mocha"
    }
}
```

---

# Tooling: Linting

**Lint code automatically as a precommit hook:**


Store in `project_root/.git/hooks/pre-commit`:

```bash
#!/bin/bash
files=$(git diff --cached --name-only | grep '\.jsx\?$')

# Prevent ESLint help message if no files matched
if [[ $files = "" ]] ; then
  exit 0
fi

failed=0
for file in ${files}; do
  git show :$file | eslint --stdin --stdin-filename $file
  if [[ $? != 0 ]] ; then
    failed=1
  fi
done;

if [[ $failed != 0 ]] ; then
  echo "ESLint check failed, commit denied"
  exit $failed
fi
```

---

# Tooling: Dependency Management

**Option 1: Lock down dependency versions with `npm shrinkwrap`.**

Caveats:

- Only respected on `npm install`, not `npm update`
- Relies on npm registry (or private registry) for deployment
- Ultimately usually slower

---

# Tooling: Dependency Management

**Option 2: Include `node_modules` in archive/artifact and run `npm rebuild`.**

Caveats:

- Increased complexity:
  - Must run `npm rebuild` on destination server prior to deployment

---

# Event-loop monitoring

> Knowing is half the battle.
*-- G.I. Joe*

- Node.js is for IO-bound tasks
- Blocking (CPU or Sync-IO) adds latency to **ALL** concurrent requests
- Event-loop iterations should be < 10ms

---

# Event-loop monitoring

**Naive solution:**

```javascript
let blockDelta = 10 // Only report >10ms lag
let frequency = 1000
setInterval(() => {
    let last = Date.now()
    setImmediate(() => {
        let delta = Date.now() - last
        if (delta > blockDelta) {
            console.log(`Event-loop blocked ${delta}ms`)
        }
    })
}, frequency)
```

---

# Event-loop monitoring

**`blocked` - "Check if the event loop is blocked."**

```bash
npm install blocked
```

```javascript
let blocked = require('blocked')

// ... Blocking code here (IO-Sync or CPU-intensive)

blocked(ms => console.log('Blocked for ' + ms))
```

---

# Event-loop monitoring

**`event-loop-lag` - Measure the event loop lag.**

```bash
npm install event-loop-lag
```

```javascript
// Update lag time every 1000ms
let lag = require('event-loop-lag')(1000)

setInterval(() => console.log(`Event-loop lag time: ${lag()}ms`), 1000)
```

*Best when combined with metrics graphing (e.g., Graphite)*

---

# Debugging

**Use Chrome DevTools to debug V8 with [`node-inspector`](https://github.com/node-inspector/node-inspector):**

```bash
npm install -g node-inspector
```

```
node-debug app.js
```

---

# Debugging

**Generate V8 heapdumps with `heapdump`:**

```bash
npm install heapdump
```

Usage:

```javascript
let heapdump = require('heapdump')
...
heapdump.writeSnapshot(filename, callback)
```

---

# Additional References

- [`idle-hands`](https://www.npmjs.com/package/idle-hands) - Perform low priority processing when event loop is idle.
- [`i-json`](https://github.com/bjouhier/i-json) - Fast incremental JSON parser
- [`webworker-threads`](https://www.npmjs.com/package/webworker-threads) - WebWorkers compatible API for CPU-bound computations
- [`node-webkit-agent`](https://github.com/c4milo/node-webkit-agent) - V8 heapdump analyzer UI
- [Flame Graphs](http://www.brendangregg.com/flamegraphs.html)
- Joyent ["Production Practices"](https://www.joyent.com/developers/node/design)
- [`longjohn`](https://github.com/mattinsler/longjohn) - Long (async) stack traces
- [Tracking Down Memory Leaks in Node.js](https://hacks.mozilla.org/2012/11/tracking-down-memory-leaks-in-node-js-a-node-js-holiday-season/)

---

class: center, middle

# Questions?
