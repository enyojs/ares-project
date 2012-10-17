/**
 * Hermes ZIP archival service
 */

var fs = require("fs");
var path = require("path");
var express = require("express");
var util  = require("util");
var querystring = require("querystring");
var temp = require("temp");
var zipstream = require('zipstream');
var formidable = require('formidable');

function ArZip(config, next) {
	function HttpError(msg, statusCode) {
		Error.captureStackTrace(this, this);
		this.statusCode = statusCode || 500; // Internal-Server-Error
		this.message = msg || 'Error';
	}
	util.inherits(HttpError, Error);
	HttpError.prototype.name = "HTTP Error";

	// (simple) parameters checking
	config.pathname = config.pathname || '/archive';

	var app = express.createServer(); // XXX replace by external HTTP server
	app.use(express.logger('dev'));

	// CORS -- Cross-Origin Resources Sharing
	app.use(function(req, res, next) {
		console.log("setting CORS");
		res.header('Access-Control-Allow-Origin', "*"); // XXX be safer than '*'
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		if ('OPTIONS' == req.method) {
			res.status(200).end();
		}
		else {
			next();
		}
	});

	// Authentication
	app.use(express.cookieParser());
	app.use(function(req, res, next) {
		console.log("checking auth");
		if (req.connection.remoteAddress !== "127.0.0.1") {
			next(new Error("Access denied from IP address "+req.connection.remoteAddress));
		} else {
			next();
		}
	});

	// Error handler (4 parameters)
	app.use(function(err, req, res, next){
		console.log("error handler, err=" + util.inspect(err));
		if (err) {
			res.status(500).send(err.toString());
		} else {
			res.status(500).end();
		}
	});

	/**
	 * Make sane Express matching paths
	 * @private
	 */
	function makeExpressRoute(path) {
		return (config.pathname + path)
			.replace(/\/+/g, "/") // compact "//" into "/"
			.replace(/(\.\.)+/g, ""); // remove ".."
	}

	// Create archive
	var servicePath = makeExpressRoute('/zip');
	console.log("servicePath=" + servicePath);
	app.post(servicePath, function(req, res, next) {
		try {
			// XXX test content-type: must be multipart/form-data

			var form = new formidable.IncomingForm();
			var zip = zipstream.createZip({level: 1});
			var ongoing = { form: true, files: 0 };
			res.contentType('application/zip');
			zip.pipe(res);
			form.onPart = function(part) {
				try {
					console.log("part=" + util.inspect(part));
					if (!part.filename) {
						// let formidable handle all non-file parts
						form.handlePart(part);
					} else {
						console.log("Adding '" + part.filename + "'...");
						ongoing.files++;
						zip.addFile(part, {name: part.filename}, function() {
							console.log("Added: '" + part.filename + "'");
							ongoing.files--;
							_complete();
						});
					}
				} catch(e) {
					next(e);
				}
			};

			form.on('end', function() {
				console.log('form end');
				ongoing.form = false;
				_complete();
			});
			
 			// form.parse(req);

			form.parse(req, function(err, fields, files) {
				if (err) {
					next(err);
					return;
				}
				console.log("form parsed: fields=" + util.inspect(fields) + ", files=" + util.inspect(files));
			});


		} catch(e) {
			console.error(e.stack);
			next(new HttpError(e.msg));
		}

		function _complete(ar) {
			console.log("ongoing=" + util.inspect(ongoing));
			if (ongoing.form || ongoing.files) {
				return;
			} else {
				zip.finalize(function(written) {
					console.log(written + ' bytes written into ' + this.path);
					res.status(201 /*Created*/).end();
				});
			}
		}

	});

	// start the filesystem (fs) server & notify the IDE server
	// (parent) where to find it

	app.listen(config.port, "127.0.0.1", null /*backlog*/, function() {
		// Send back the URL to the IDE server, when port is
		// actually bound
		var service = {
			origin: "http://127.0.0.1:"+app.address().port.toString(),
			pathname: config.pathname
		};
		return next(null, service);
	});

	/**
	 * Terminates express server
	 */
	this.quit = function() {
		app.close();
		Archive.cleanAll();
		console.log("arZip exiting");
	};

}

if (path.basename(process.argv[1]) === "arZip.js") {
	// We are main.js: create & run the object...

	var version = process.version.match(/[0-9]+.[0-9]+/)[0];
	if (version <= 0.7) {
		process.exit("Only supported on Node.js version 0.8 and above");
	}

	var arZip = new ArZip({
		// pathname (M) can be '/', '/archive/' ...etc
		pathname:	process.argv[2],
		// port (o) local IP port of the express server (default: 9019, 0: dynamic)
		port: parseInt(process.argv[3] || "9019", 10)
	}, function(err, service){
		if (err) {
			process.exit(err);
		}
		console.log("arZip['"+process.argv[3]+"'] available at "+service.origin + service.pathname);
		if (process.send) {
			// only possible/available if parent-process is node
			process.send(service);
		}
	});

} else {

	// ... otherwise hook into commonJS module systems
	module.exports = ArZip;
}
