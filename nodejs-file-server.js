/**
 * http://stackoverflow.com/questions/7268033/basic-static-file-server-in-nodejs
 */
// https://github.com/tlrobinson/long-stack-traces
var lst = require("long-stack-traces");
var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
var mimeTypes = {
	"html": "text/html",
	"jpeg": "image/jpeg",
	"jpg": "image/jpeg",
	"png": "image/png",
	"js": "text/javascript",
	"css": "text/css"};

http.createServer(function(req, res) {
	var uri = url.parse(req.url).pathname;
	var filename = path.join(process.cwd(), unescape(uri));
	var stats;

	try {
		stats = fs.lstatSync(filename); // throws if path doesn't exist
	} catch (e) {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.write('404 Not Found\n');
		res.end();
		return;
	}


	if (stats.isFile()) {
		// path exists, is a file
		var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
		res.writeHead(200, {'Content-Type': mimeType} );

		var fileStream = fs.createReadStream(filename);
		fileStream.pipe(res);
	} else if (stats.isDirectory()) {
		// path exists, is a directory
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write('Index of '+uri+'\n');
		res.write('TODO, show index?\n');
		res.end();
	} else {
		// Symbolic link, other?
		// TODO: follow symlinks?  security?
		res.writeHead(500, {'Content-Type': 'text/plain'});
		res.write('500 Internal server error\n');
		res.end();
	}

}).listen(1337);