let http = require('http')
let fs = require('fs')
require('songbird')

http.createServer((req, res) => {
   let path = require('url').parse(req.url).pathname
   let dirName = JSON.stringify(path)
  // var dirName = JSON.stringify(dirName)
  //  let promise = ls();
   // promise.then(result => res.end(result); )
   res.setHeader("Content-Type", "application/json"); //Wht a header?
    res.writeHead(200)
   async() => {
   	res.end(await ls(dirName))
   }()

    //res.end()
}).listen(8000, '127.0.0.1')
console.log('Server running at http://127.0.0.1:8000/')

// Mark function as 'async' to use 'await'
async function ls(dirName){

	if(dirName != undefined) {
	console.log('ls is called with dirName'+dirName);

	let dirStat = await fs.promise.readdir(dirName)

	if(dirStat)

    // Use 'await' to wait for the promise to resolve
    let files = await fs.promise.readdir(dirName)
    console.log("Files in "+dirName + 'are '+files);

    let promises = [];
    let filteredFiles = [];
    for (let file of files) {
    
        let stat = await getStats(file)
        console.log(file + "is a directory "+ stat.isDirectory());
        if(!stat.isDirectory()) {
        	filteredFiles.push(file);
        }

    }

    console.log(filteredFiles) 
    return JSON.stringify(filteredFiles.join(','));
}
}

async function getStats(filename){
// Use 'await' to wait for the promise to resolve
    let stats = await fs.promise.stat(__dirname+'/'+filename)
     //console.log(stats) 
     return stats
}

// Log errors
ls().catch(e => console.log(e.stack))

