/**
 * Hermes PhoneGap build service
 */

var fs = require("fs");
var path = require("path");
var express = require("express");
var util  = require("util");
var querystring = require("querystring");
var temp = require("temp");
var zipstream = require('zipstream');
var formidable = require('formidable'),
    async = require("async"),
    mkdirp = require("mkdirp"),
    rimraf = require("rimraf"),
    http = require("http");

var basename = path.basename(__filename);

function BdPhoneGap(config, next) {
	console.log("config=" + util.inspect(config));

	function HttpError(msg, statusCode) {
		Error.captureStackTrace(this, this);
		this.statusCode = statusCode || 500; // Internal-Server-Error
		this.message = msg || 'Error';
	}
	util.inherits(HttpError, Error);
	HttpError.prototype.name = "HTTP Error";

	// (simple) parameters checking
	config.pathname = config.pathname || '/phonegap';

	/*
	// express-3.x
	var app = express(),
	    server = http.createServer(app); // XXX replace by HTTP server from config
	 */
	// express-2.x
	var app = express.createServer(),
	    server = app;

	app.use(express.logger('dev'));

	// CORS -- Cross-Origin Resources Sharing
	app.use(function(req, res, next) {
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
		if (req.connection.remoteAddress !== "127.0.0.1") {
			next(new Error("Access denied from IP address "+req.connection.remoteAddress));
		} else {
			next();
		}
	});

	// Built-in form parser
	var uploadDir = temp.path({prefix: 'com.palm.ares.hermes.bdPhoneGap'}) + '.d';
	fs.mkdirSync(uploadDir);
	app.use(express.bodyParser({keepExtensions: true, uploadDir: uploadDir}));

	/**
	 * Global error handler
	 * @private
	 */
	function errorHandler(err, req, res, next){
		res.status(err.statusCode || 500).send(err.toString());
	}

	if (app.error) {
		// express-2.x: explicit error handler
		app.error(errorHandler);
	} else {
		// express-3.x: middleware with arity === 4 is detected as the error handler
		app.use(errorHandler);
	}

	/**
	 * Make sane Express matching paths
	 * @private
	 */
	function makeExpressRoute(path) {
		return (config.pathname + path)
			.replace(/\/+/g, "/") // compact "//" into "/"
			.replace(/(\.\.)+/g, ""); // remove ".."
	}

	var servicePath = makeExpressRoute('');
	app.post(servicePath, function(req, res, next) {
		//returnZip.bind(this, req, res)(next);

		// debugger;
		async.series([
		 	prepare.bind(this),
			dispatchFiles.bind(this, req, res),
			bundle.bind(this, req, res),
			respond.bind(this, req, res),
			cleanup.bind(this, req, res),

			// function(done) {
			// 	// prepare local files & directories
			// 	prepare(req, res, done);
			// }, function(done) {
			// 	// parse & store multipart/form-data
			// 	receive(req, res, done);
			// }, function(done) {
			// 	// return multipart/form-data as a ZIP archive
			// 	returnZip(req, res, done);
			// }, function(done) {
			// 	// minify & compile LESS
			// 	deployApp(req, res, done);
			// }, function(done) {
			// 	// prepare ZIP for for PhoneGap
			// 	bundle(req, res, done);
			// }, function(done) {
			// 	// submit ZIP to PhoneGap
			// 	callPhoneGap(req, res, done);
			// }, function(done) {
			// 	// return application package to Ares
			// 	respond(req, res, done);
			// }, function(done) {
			// 	// cleanup local resources
			// 	cleanup(req, res, done);
			// }

		], function (err, results) {
			if (err) {
				// cleanup & run express's next() : the errorHandler
				console.error(err.stack);
				cleanup.bind(this, req, res, next.bind(this, err));
				return;
			}
			console.log("POST "  + servicePath + " finished");
		});
	});
	
	server.listen(config.port, "127.0.0.1", null /*backlog*/, function() {
		// Send back the URL to the parent process, when the
		// port is assigned
		var service = {
			origin: "http://127.0.0.1:"+server.address().port.toString(),
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

	var appTempDir = temp.path({prefix: 'com.palm.ares.hermes.bdPhoneGap.'}) + '.d';
	var appDir = {
		root: appTempDir,
		//upload: path.join(appTempDir, 'upload'),
		source: path.join(appTempDir, 'source'),
		build: path.join(appTempDir, 'build'),
		deploy: path.join(appTempDir, 'deploy')
	};

	function prepare(next) {
		console.log("prepare(): setting-up " + appDir.root);
		async.series([
			function(done) { mkdirp(appDir.root, done); },
			//function(done) { fs.mkdir(appDir.upload, done); },
			function(done) { fs.mkdir(appDir.source, done); },
			function(done) { fs.mkdir(appDir.build, done); },
			function(done) { fs.mkdir(appDir.deploy, done); }
		], function(err) {
			console.log("prepare(): done (err=", err, ")");
			next(err);
		});
	}

	function receive(req, res, next) {
		console.log("receive(): ");
		debugger;
		var form, fields = [], files = [];

		req.on('close', function() {
			throw new Error('client connection closed');
		});

		if (!req.is('multipart/form-data')) {
			throw new HttpError("Not a multipart request", 415 /*Unsupported Media Type*/);
		}
		
		form = new formidable.IncomingForm();
		form.uploadDir = appDir.upload;

		form.on('field', function(name, value) {
			fields.push([name, value]);
		});
		
		form.on('file', function(name, file) {
			files.push(file);
		});

		form.parse(req, function(err) {
			if (err) throw err;
			console.log("receive(): form parsed");
			// create necessary directory layout
			async.forEachSeries(files, function(file, done) {
				var dir = path.join(appDir.source, path.dirname(file.name));
				console.log("receive(): mkdir -p " + dir);
				mkdirp(dir, done);
			}, function(err) {
				next(err);
				// move received files into real layout
				async.forEach(files, function(file, done) {
					console.log("receive(): mv " + file.path + " "  + file.name);
					fs.rename(file.path, path.join(appDir.source, file.name), done);
				}, function(err, results) {
					console.log("receive(): moved " + util.inspect(results));
					next(err);
				});
			});
		});
	}

	function dispatchFiles(req, res, next) {
		//console.log("dispatchFiles(): req.files = ", util.inspect(req.files));

		if (!req.is('multipart/form-data')) {
			next(new HttpError("Not a multipart request", 415 /*Unsupported Media Type*/));
			return;
		}

		if (!req.files.file) {
			next(new HttpError("No file found in the multipart request", 400 /*Bad Request*/));
			return;
		}

		async.forEachSeries(req.files.file, function(file, cb) {
			var dir = path.join(appDir.source, path.dirname(file.name));
			console.log("dispatchFiles(): mkdir -p ", dir);
			mkdirp(dir, function(err) {
				console.log("dispatchFiles(): mv ", file.path, " ", file.name);
				if (err) {
					cb(err);
				} else {
					fs.rename(file.path, path.join(appDir.source, file.name), function(err) {
						console.log("dispatchFiles(): done: ", file.name);
						cb(err);
					});
				}
			});
		}, function(err) {
			console.log("dispatchFiles(): done");
			next(err);
		});
	}

	function deployApp(req, res, next) {}

	function bundle(req, res, next) {
		console.log("bundle(): ");
		req.zip = {};
		req.zip.path = path.join(appDir.root, "app.zip");
		req.zip.stream = zipstream.createZip({level: 1});
		req.zip.stream.pipe(fs.createWriteStream(req.zip.path));
		_walk.bind(this)(appDir.source, "" /*prefix*/, function() {
			req.zip.stream.finalize(function(written){
				console.log("finished ", req.zip.path);
				next();
			});
		});

		function _walk(absParent, relParent, cb) {
			// TODO that _thing_ probably needs a bit of
			// refactoring by someone that feels easy with
			// node-async _arcanes_.
			console.log("bundle._walk(): Parsing: ", relParent);
			async.waterfall([
				function(cb2) {
					console.log("bundle._walk(): readdir: ", absParent);
					fs.readdir(absParent, cb2);
				},
				function(nodes, cb2) {
					console.log("bundle._walk(): nodes.forEach");
					async.forEachSeries(nodes, function(name, cb3) {
						var absPath = path.join(absParent, name),
						    relPath = path.join(relParent, name);
						console.log("bundle._walk(): stat: ", absPath);
						fs.stat(absPath, function(err, stat) {
							if (err) {
								cb3(err);
								return;
							}
							if (stat.isDirectory()) {
								_walk(absPath, relPath,  /*cb3*/ function(err) {
									console.log("bundle._walk(): cb3 (2/3) = ", util.inspect(cb3));
									cb3(err);
								});
							} else {
								console.log("bundle._walk(): Adding: ", relPath);
								req.zip.stream.addFile(fs.createReadStream(absPath), { name: relPath }, /*cb3*/ function(err) {
									console.log("bundle._walk(): cb3 (3/3) = ", util.inspect(cb3));
									cb3(err);
								});
							}
						});
					}, /*cb2*/ function(err) {
						console.log("bundle._walk(): cb2 = ", util.inspect(cb2));
						cb2(err);
					});
				}
			], /*cb*/ function(err) {
				console.log("bundle._walk(): cb = ", util.inspect(cb));
				cb(err);
			});
		}
	}

	function callPhoneGap(req, res, next) {}

	function respond(req, res, next) {
		console.log("respond()");
		res.status(200).sendfile(req.zip.path);
		// detach the zip file name & stream from the request
		delete req.zip;
		next();
	}

	function cleanup(req, res, next) {
		console.log("cleanup(): rm -rf " + appDir.root);
		rimraf(appDir.root, function(err) {
			console.log("cleanup(): removed " + appDir.root);
			next(err);
		});
	}
}

if (path.basename(process.argv[1]) === basename) {
	// We are main.js: create & run the object...

	var version = process.version.match(/[0-9]+.[0-9]+/)[0];
	if (version <= 0.7) {
		process.exit("Only supported on Node.js version 0.8 and above");
	}

	new BdPhoneGap({
		// pathname (M) can be '/', '/build/' ...etc
		pathname:	process.argv[2] || '/build',
		// port (o) local IP port of the express server (default: 9019, 0: dynamic)
		port: parseInt(process.argv[3] || "9029", 10)
	}, function(err, service){
		if (err) {
			process.exit(err);
		}
		if (process.send) {
			// only possible/available if parent-process is node
			process.send(service);
		}
	});

} else {

	// ... otherwise hook into commonJS module systems
	module.exports = BdPhoneGap;
}
