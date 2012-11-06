/**
 * Hermes PhoneGap build service
 */

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    querystring = require("querystring"),
    temp = require("temp"),
    zipstream = require('zipstream'),
    formidable = require('formidable'),
    async = require("async"),
    mkdirp = require("mkdirp"),
    rimraf = require("rimraf"),
    http = require("http"),
    child_process = require("child_process"),
    api = require("phonegapbuildapi");

var basename = path.basename(__filename);

function BdPhoneGap(config, next) {
	console.log("config=",  util.inspect(config));

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
		console.error("errorHandler(): ", err.stack);
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
		async.series([
		 	prepare.bind(this),
			store.bind(this, req, res),
			deploy.bind(this, req, res),
			zip.bind(this, req, res),
			build.bind(this, req, res),
			respond.bind(this, req, res),
			cleanup.bind(this, req, res)
		], function (err, results) {
			if (err) {
				// cleanup & run express's next() : the errorHandler
				cleanup.bind(this)(req, res, next.bind(this, err));
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
	 * Terminates express server & clean-up the plate
	 */
	this.quit = function(cb) {
		app.close();
		rimraf(uploadDir, cb);
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
		], next);
	}


	function store(req, res, next) {
		//console.log("store(): req.files = ", util.inspect(req.files));

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
			//console.log("store(): mkdir -p ", dir);
			mkdirp(dir, function(err) {
				//console.log("store(): mv ", file.path, " ", file.name);
				if (err) {
					cb(err);
				} else {
					fs.rename(file.path, path.join(appDir.source, file.name), function(err) {
						console.log("store(): Stored: ", file.name);
						cb(err);
					});
				}
			});
		}, next);
	}

	function deploy(req, res, next) {
		console.log("deploy(): started");
		// Execute the deploy.js script that comes with Enyo.
		// 
		// TODO: scalable processing is better acheived using
		// VM <http://nodejs.org/api/vm.html> rather than
		// child-processes
		// <http://nodejs.org/api/child_process.html>.
		var script = path.join(config.enyoDir, 'tools', 'deploy.js');
		var params = [ '--packagejs', path.join(appDir.source, 'package.js'),
			       '--source', appDir.source,
			       '--enyo', config.enyoDir,
			       '--build', appDir.build,
			       '--out', appDir.deploy,
			       '--less'];
		console.log("deploy(): Running: '", script, params.join(' '), "'");
		var child = child_process.fork(script, params, {
			silent: false
		});
		child.on('message', function(msg) {
			if (msg.error) {
				console.error("child-process error: ", util.inspect(msg.error));
				console.error("child-process stack: \n", msg.error.stack);
			} else {
				console.error("unexpected child-process message msg=", util.inspect(msg));
			}
		});
		child.on('exit', function(code, signal) {
			if (code !== 0) {
				next(new HttpError("child-process failed"));
			} else {
				console.log("deploy(): completed");
				next();
			}
		});
	}

	function zip(req, res, next) {
		//console.log("zip(): ");
		req.zip = {};
		req.zip.path = path.join(appDir.root, "app.zip");
		req.zip.stream = zipstream.createZip({level: 1});
		req.zip.stream.pipe(fs.createWriteStream(req.zip.path));
		_walk.bind(this)(appDir.deploy, "" /*prefix*/, function() {
			try {
				req.zip.stream.finalize(function(written){
					console.log("finished ", req.zip.path);
					next();
				});
			} catch(e) {
				next(e);
			}
		});

		function _walk(absParent, relParent, cb) {
			// TODO that _thing_ probably needs a bit of
			// refactoring by someone that feels easy with
			// node-async _arcanes_.
			//console.log("zip._walk(): Parsing: ", relParent);
			async.waterfall([
				function(cb2) {
					//console.log("zip._walk(): readdir: ", absParent);
					fs.readdir(absParent, cb2);
				},
				function(nodes, cb2) {
					//console.log("zip._walk(): nodes.forEach");
					async.forEachSeries(nodes, function(name, cb3) {
						var absPath = path.join(absParent, name),
						    relPath = path.join(relParent, name);
						//console.log("zip._walk(): stat: ", absPath);
						fs.stat(absPath, function(err, stat) {
							if (err) {
								cb3(err);
								return;
							}
							if (stat.isDirectory()) {
								_walk(absPath, relPath, cb3);
							} else {
								console.log("zip._walk(): Adding: ", relPath);
								try {
									req.zip.stream.addFile(fs.createReadStream(absPath), { name: relPath }, function(err) {
										console.log("zip._walk(): Added: ", relPath, "(err=", err, ")");
										cb3(err);
									});
								} catch(e) {
									cb3(e);
								}
							}
						});
					}, cb2);
				}
			], cb);
		}
	}

	function build(req, res, next) {
		console.log("build(): fields req.body = ", util.inspect(req.body));
		var errs = [];
		var mandatory = ['token', 'title'];
		mandatory.forEach(function(field) {
			if (!req.body[field]) {
				errs.push("missing form field: '" + field + "'");
			}
		});
		if (errs.length > 0) {
			_fail(errs.toString());
			return;
		}
		if (req.body.appId) {
			console.log("build(): updating appId="+ req.body.appId + " (title='" + req.body.title + "')");
			api.updateFileBasedApp(req.body.token, req.zip.path, req.body.appId, {
				success: next,
				error: _fail
			});
		} else {
			console.log("build(): creating new appId for title=" + req.body.title + "");
			api.createFileBasedApp(req.body.token, req.zip.path, {
				// reqData
				create_method: 'file',
				title: req.body.title
			}, {
				success: _success,
				error: _fail
			});
		}
		
		function _success(data) {
			try {
				console.log("build(): ", util.inspect(data));
				if (typeof data === 'string') {
					data = JSON.parse(data);
				}
				if (typeof data.error === 'string') {
					_fail(data.error);
					return;
				}
				res.body = data;
				next();
			} catch(e) {
				_fail(e.toString());
			}
		}
		
		function _fail(errMsg) {
			console.error("build(): error ", errMsg);
			next(new HttpError("PhoneGap build error: " + errMsg, 400 /*Bad Request*/));
		}
	}
	
	function respond(req, res, next) {
		console.log("respond(): ", res.body);

		res.status(200).send(res.body);
		delete res.body;

		//res.status(200).sendfile(req.zip.path);
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
		port: parseInt(process.argv[3] || "9029", 10),
		enyoDir: path.resolve(__dirname, '..', 'enyo') // XXX use optimist/nopt
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
