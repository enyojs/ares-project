/* jshint node:true */
/**
 * Hermes ZIP archival service
 */

// nodejs version checking is done in parent process ide.js

var fs = require("fs"),
	path = require("path"),
	express = require("express"),
	util  = require("util"),
	temp = require("temp"),
	zipstream = require('zipstream'),
	formidable = require('formidable');

function ArZip(config, next) {
	function HttpError(msg, statusCode) {
		Error.captureStackTrace(this, this);
		this.statusCode = statusCode || 500; // Internal-Server-Error
		this.message = msg || 'Error';
	}
	util.inherits(HttpError, Error);
	HttpError.prototype.name = "HTTP Error";

	// (simple) parameters checking
	config.pathname = config.pathname || '/arZip';

	var app = express.createServer(); // XXX replace by external HTTP server
	app.use(express.logger('dev'));

	// CORS -- Cross-Origin Resources Sharing
	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', "*"); // XXX be safer than '*'
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HTTP-Method-Override');
		if ('OPTIONS' == req.method) {
			res.status(200).end();
		} else {
			next();
		}
	});

	// Authentication
	app.use(express.cookieParser());
	app.use(function(req, res, next) {
		if (req.connection.remoteAddress !== "127.0.0.1") {
			next(new Error("Access denied from IP address "+req.connection.remoteAddress));
		} else {
			next();
		}
	});

	// Error handler
	app.error(function(err, req, res, next){
		res.status(err.statusCode || 500).send(err.toString());
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
	var servicePath = makeExpressRoute('');
	app.post(servicePath, function(req, res, next) {
		var form, zip, tasks, zipping = false;
		var files = [], fields = [];
		try {
			if (!req.is('multipart/form-data')) {
				next(new HttpError("Not a multipart request", 415 /*Unsupported Media Type*/));
				return;
			}

			tasks = [];

			res.contentType('application/zip');

			zip = zipstream.createZip({level: 1});
			zip.pipe(res);

			form = new formidable.IncomingForm();

			// We use an intermediate temporary directory,
			// because the following issue prevents piping
			// directly node-formidable input-streams into
			// a node-zipstream output-stream (archive).
			// <https://github.com/felixge/node-formidable/issues/182>,

			form.uploadDir = temp.path({prefix: 'com.palm.ares.hermes.arZip.'}) + '.d';
			fs.mkdirSync(form.uploadDir);

			form.on('file', function(field, file) {
				console.log("file name=", file.name);
				files.push(file);
				tasks.push(function() {
					zipping = true;
					zip.addFile(new fs.createReadStream(file.path), {name: file.name}, function() {
						_nextTask();
					});
				});
			});

			form.on('field', function(field, value) {
				console.log(field, value);
				fields.push([field, value]);
			});

			form.on('end', function() {
				tasks.push(function() {
					zip.finalize(function(written) {
						res.status(201 /*Created*/).end();
						_clean();
					});
				});
				_nextTask();
			});

			var _nextTask = function() {
				var task = tasks.shift();
				if (task) {
					task();
				}
			};

			form.parse(req, function(err) {
				if (err) {
					next(err);
				}
			});

			var _clean = function(next) {
				var file, count = files.length;
				function _rmdir() {
					if (count === 0) {
						fs.rmdir(form.uploadDir, next);
					}
				}
				_rmdir();
				function disconnect(file) {
					fs.unlink(file.path, function(err) {
						if (err) {
							next(err);
							return;
						}
						count--;
						_rmdir();
					});
				}
				while ((file = files.shift())) {
					disconnect(file);
				}
			};
		} catch(e) {
			console.error(e.stack);
			next(new HttpError(e.msg));
		}
	});

	// start the archive (ar) server & notify the IDE server
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
	};

}

if (path.basename(process.argv[1]) === "arZip.js") {
	// We are main.js: create & run the object...

	new ArZip({
		// pathname (M) can be '/', '/zip/' ...etc
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
