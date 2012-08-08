var fs = require('fs')
	, HermesFilesystem = require('./hermesFilesystem').HermesFilesystem
	, basePort = parseInt(process.argv[2], 10) || 9009
	, config = {
			certs: {
				key: fs.readFileSync(__dirname + '/certs/key.pem').toString(),
				cert: fs.readFileSync(__dirname + '/certs/cert.pem').toString()
			}
		, port: basePort+1
		, debug: true
		}
	, hermesFilesystem = new HermesFilesystem(config);

// express-based static files server, for local clients only

var path = require("path");
var enyojsRoot = path.resolve(__dirname, "..", "..", "..");
var http = require('http');
var express = require('express');
var app = express.createServer();

app.configure(function(){
	app.use('/ide', express.static(enyojsRoot + '/ares-project'));
	app.use('/enyo', express.static(enyojsRoot + '/enyo'));
	app.use('/lib', express.static(enyojsRoot + '/lib'));
});
app.listen(basePort, "127.0.0.1");

console.log("ARES is now running at <http://localhost:" + basePort + "> Press CTRL + C to shutdown");
