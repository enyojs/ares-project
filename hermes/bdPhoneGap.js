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
    api = require("phonegapbuildapi"),
    optimist = require('optimist');

var basename = path.basename(__filename);

function BdPhoneGap(config, next) {
	function HttpError(msg, statusCode) {
		Error.captureStackTrace(this, this);
		this.statusCode = statusCode || 500; // Internal-Server-Error
		this.message = msg || 'Error';
	}
	util.inherits(HttpError, Error);
	HttpError.prototype.name = "HTTP Error";

	// (simple) parameters checking
	config.pathname = config.pathname || '/phonegap';

	var deployScript = path.join(config.enyoDir, 'tools', 'deploy.js');
	try {
		var stat = fs.statSync(deployScript);
		if (!stat.isFile()) throw "Not a file";
	} catch(e) {
		// Build a more usable exception
		next(new Error("Not a suitable Enyo: it does not contain a usable 'tools/deploy.js'"));
	}

	console.log("config=",  util.inspect(config));

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

	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.field[]
	var uploadDir = temp.path({prefix: 'com.palm.ares.hermes.bdPhoneGap'}) + '.d';
	fs.mkdirSync(uploadDir);
	app.use(express.bodyParser({keepExtensions: true, uploadDir: uploadDir}));

	/**
	 * Global error handler
	 * @private
	 */
	function errorHandler(err, req, res, next){
		console.error("errorHandler(): ", err.stack);
		res.status(err.statusCode || 500);
		res.contentType('txt'); // direct usage of 'text/plain' does not work
		res.send(err.toString());
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

	// Return the ZIP-ed deployed Enyo application
	app.post(makeExpressRoute('/deploy'), function(req, res, next) {
		async.series([
			prepare.bind(this, req, res),
			store.bind(this, req, res),
			deploy.bind(this, req, res),
			zip.bind(this, req, res),
			returnZip.bind(this, req, res),
			cleanup.bind(this, req, res)
		], function (err, results) {
			if (err) {
				// cleanup & run express's next() : the errorHandler
				cleanup.bind(this)(req, res, next.bind(this, err));
				return;
			}
		});
	});

	app.post(makeExpressRoute('/token'), getToken);
	
	// Upload ZIP-ed deployed Enyo application to the
	// https://build.phonegap.com online service and return the
	// JSON-encoded response of the service.
	app.post(makeExpressRoute('/build'), function(req, res, next) {
		async.series([
			prepare.bind(this, req, res),
			store.bind(this, req, res),
			deploy.bind(this, req, res),
			zip.bind(this, req, res),
			build.bind(this, req, res),
			returnBody.bind(this, req, res),
			cleanup.bind(this, req, res)
		], function (err, results) {
			if (err) {
				// cleanup & run express's next() : the errorHandler
				cleanup.bind(this)(req, res, next.bind(this, err));
				return;
			}
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
		console.log(basename,  " exiting");
	};

	function prepare(req, res, next) {
		var appTempDir = temp.path({prefix: 'com.palm.ares.hermes.bdPhoneGap.'}) + '.d';
		req.appDir = {
			root: appTempDir,
			source: path.join(appTempDir, 'source'),
			build: path.join(appTempDir, 'build'),
			deploy: path.join(appTempDir, 'deploy')
		};

		console.log("prepare(): setting-up " + req.appDir.root);
		async.series([
			function(done) { mkdirp(req.appDir.root, done); },
			function(done) { fs.mkdir(req.appDir.source, done); },
			function(done) { fs.mkdir(req.appDir.build, done); },
			function(done) { fs.mkdir(req.appDir.deploy, done); }
		], next);
	}


	function store(req, res, next) {
		if (!req.is('multipart/form-data')) {
			next(new HttpError("Not a multipart request", 415 /*Unsupported Media Type*/));
			return;
		}

		if (!req.files.file) {
			next(new HttpError("No file found in the multipart request", 400 /*Bad Request*/));
			return;
		}

		async.forEachSeries(req.files.file, function(file, cb) {
			var dir = path.join(req.appDir.source, path.dirname(file.name));
			//console.log("store(): mkdir -p ", dir);
			mkdirp(dir, function(err) {
				//console.log("store(): mv ", file.path, " ", file.name);
				if (err) {
					cb(err);
				} else {
					fs.rename(file.path, path.join(req.appDir.source, file.name), function(err) {
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
		var params = [ '--verbose',
			       '--packagejs', path.join(req.appDir.source, 'package.js'),
			       '--source', req.appDir.source,
			       '--enyo', config.enyoDir,
			       '--build', req.appDir.build,
			       '--out', req.appDir.deploy,
			       '--less'];
		console.log("deploy(): Running: '", deployScript, params.join(' '), "'");
		var child = child_process.fork(deployScript, params, {
			silent: false
		});
		child.on('message', function(msg) {
			console.log("deploy():", msg);
			if (msg.error) {
				console.error("child-process error: ", util.inspect(msg.error));
				child.errMsg = msg.error;
			} else {
				console.error("unexpected child-process message msg=", util.inspect(msg));
			}
		});
		child.on('exit', function(code, signal) {
			if (code !== 0) {
				next(new HttpError(child.errMsg || ("child-process failed: '"+ child.toString() + "'")));
			} else {
				console.log("deploy(): completed");
				next();
			}
		});
	}

	function zip(req, res, next) {
		//console.log("zip(): ");
		req.zip = {};
		req.zip.path = path.join(req.appDir.root, "app.zip");
		req.zip.stream = zipstream.createZip({level: 1});
		req.zip.stream.pipe(fs.createWriteStream(req.zip.path));
		_walk.bind(this)(req.appDir.deploy, "" /*prefix*/, function() {
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

	function getToken(req, res, next) {
		// XXX !!! leave this log commented-out to not log password !!!
		console.log("getToken(): req.body = ", util.inspect(req.body));
		api.createAuthToken(req.body.username + ':' +req.body.password, {
			success: function(token) {
				res.status(200).send({token: token});
				next();
			},
			error: function(errStr) {
				next(new Error(errStr));
			}
		});
	}

	function build(req, res, next) {
		console.log("build(): fields req.body = ", util.inspect(req.body));
		var reqData = {};
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
			reqData.create_method = 'file';
			for (var p in req.body) {
				if (typeof p === 'string') {
					reqData[p] = req.body[p];
				}
			}
			console.log("build(): reqData=", reqData);
			api.createFileBasedApp(req.body.token, req.zip.path, reqData, {
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
	
	function returnZip(req, res, next) {
		console.log("returnZip(): ", res.body);
		res.status(200).sendfile(req.zip.path);
		delete req.zip;
		next();
	}

	function returnBody(req, res, next) {
		console.log("returnBody(): ", res.body);
		res.status(200).send(res.body);
		delete res.body;
		delete req.zip;
		next();
	}

	function cleanup(req, res, next) {
		console.log("cleanup(): rm -rf " + req.appDir.root);
		rimraf(req.appDir.root, function(err) {
			console.log("cleanup(): removed " + req.appDir.root);
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

	var argv = optimist.usage(
		"Ares PhoneGap build service\nUsage: $0 [OPTIONS]", {
			'P': {
				description: "URL pathname prefix (before /deploy and /build",
				required: false,
				default: "/phonegap"
			},
			'p': {
				description: "TCP port number",
				required: false,
				default: "9029"
			},
			'e': {
				description: "Path to the Enyo version to use for mnifying the application",
				required: false,
				default: path.resolve(__dirname, '..', 'enyo')
			},
			'h': {
				description: "Display help",
				boolean: true,
				required: false
			}
		}).argv;
	
	if (argv.h) {
		optimist.showHelp();
		process.exit(0);
	};

	new BdPhoneGap({
		pathname: argv.P,
		port: parseInt(argv.p, 10),
		enyoDir: argv.e
	}, function(err, service){
		if(err) process.exit(err);
		// process.send() is only available if the
		// parent-process is also node
		if (process.send) process.send(service);
	});

} else {

	// ... otherwise hook into commonJS module systems
	module.exports = BdPhoneGap;
}
