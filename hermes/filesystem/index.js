/* global require, console, process, __dirname */
/**
 * filesystem/index.js -- Framework-based ARES FileSystemProvider, using local files.
 */

var fs = require('fs'),
    HermesFilesystem = require(__dirname + '/hermesFilesystem').HermesFilesystem,
    secure = (process.argv[4] ? true : false), //FIXME: use node-optimist to parse options
    config = {
	    port: parseInt(process.argv[2], 10) || 0,
	    root: process.argv[3],
	    debug: true
    };
if (config.debug) {
	console.log("Arguments:");
	console.dir(process.argv);
}
if (secure) {
	config.certs = {
		key: fs.readFileSync(__dirname + '/certs/key.pem').toString(),
		cert: fs.readFileSync(__dirname + '/certs/cert.pem').toString()
	};
}
if (config.debug) {
	console.log("Configuration:");
	console.dir(config);
}
new HermesFilesystem(config);

