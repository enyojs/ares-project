/**
 * Simple ARES FileSystemProvider, using local files.
 * 
 * This FileSystemProvider is both the simplest possible one
 * and a working sample for other implementations.
 */

var fs = require('fs'),
    HermesFilesystem = require(__dirname + '/hermesFilesystem').HermesFilesystem,
    port = parseInt(process.argv[2], 10) || 0,
    directory = process.argv[3],
    secure = (process.argv[4] ? true : false),
    config = {
	    port: parseInt(process.argv[2], 10) || 0,
	    debug: false
    };

if (config.debug) {
	process.argv.forEach(function (val, index, array) {
		console.log(index + ': ' + val);
	});
}

if (secure) {
	console.log("Using https with a self-signed SSL certificate...");
	config.certs = {
		key: fs.readFileSync(__dirname + '/certs/key.pem').toString(),
		cert: fs.readFileSync(__dirname + '/certs/cert.pem').toString()
	};
} else {
	console.log("Using insecure http...");
}

var hermesFilesystem = new HermesFilesystem(config);

