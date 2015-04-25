let http = require('http');
let request = require('request');
let fs = require('fs')
let argv = require('yargs')
    .default('host', '127.0.0.1')
    .argv
let scheme = 'http://'
// Build the destinationUrl using the --host value

// Get the --port value
// If none, default to the echo server port, or 80 if --host exists
let port = argv.port || argv.host === '127.0.0.1' ? 8000 : 80

// Update our destinationUrl line from above to include the port
let destinationUrl = argv.url || scheme + argv.host + ':' + port

let outputStream = argv.log ? fs.createWriteStream(argv.log) : process.stdout

//Echo server 
http.createServer((req, res) => {
    console.log(`Request received at: ${req.url}`);
    for (let header in req.headers) {
        res.setHeader(header, req.headers[header])
    }
    req.pipe(res);
}).listen(8000);


//Proxy server
http.createServer((req, res) => {
  let url = destinationUrl
    if(req.headers['x-destination-url']){
    	url = req.headers['x-destination-url']
    }
  console.log(`Proxying request to: ${destinationUrl + req.url}`)
    let options = {
      headers: req.headers,
      url: `http://${destinationUrl}${req.url}`
  }
  options.method = req.method;
  let downstreamResponse = req.pipe(request(options));
  process.stdout.write(JSON.stringify(downstreamResponse.headers));
  downstreamResponse.pipe(process.stdout);
  downstreamResponse.pipe(res);
}).listen(8001);

