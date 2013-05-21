/**
 * Hermes PhoneGap build service
 */

// nodejs version checking is done in parent process ide.js

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    querystring = require("querystring"),
    temp = require("temp"),
    request = require('request'),
    zipstream = require('zipstream'),
    async = require("async"),
    mkdirp = require("mkdirp"),
    rimraf = require("rimraf"),
    http = require("http"),
    child_process = require("child_process"),
    client = require("phonegap-build-api");

var basename = path.basename(__filename);

var url = 'build.phonegap.com';

process.on('uncaughtException', function (err) {
	log.error(basename, err.stack);
	process.exit(1);
});

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

	// express 3.x: app is not a server
	var app, server;
	app = express();
	server = http.createServer(app);

	/*
	 * Middleware -- applied to every verbs
	 */

	app.use(express.logger('dev'));

	/**
	 * Make sane Express matching paths
	 * @private
	 */
	function makeExpressRoute(path) {
		return (config.pathname + path)
			.replace(/\/+/g, "/") // compact "//" into "/"
			.replace(/(\.\.)+/g, ""); // remove ".."
	}

	// CORS -- Cross-Origin Resources Sharing
	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', "*"); // XXX be safer than '*'
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
		if ('OPTIONS' == req.method) {
			res.status(200).end();
		}
		else {
			next();
		}
	});

	// Authentication
	app.use(express.cookieParser());

	function addCookie(res, key, value) {
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + 10 /*days*/);
		var cookieOptions = {
			domain: '127.0.0.1:' + config.port,
			path: config.pathname,
			httpOnly: true,
			expires: exdate
			//maxAge: 1000*3600 // 1 hour
		};
		res.cookie(key, value, cookieOptions);
		console.log("Bdphonegap.makeCookie(): Set-Cookie: " + key + ":", value || "");
	}

	app.use(function(req, res, next) {
		if (req.connection.remoteAddress !== "127.0.0.1") {
			next(new Error("Access denied from IP address "+req.connection.remoteAddress));
		} else {
			next();
		}
	});

	function authorize(req, res, next) {
		console.log("bdPhoneGap.authorize(): req.url:", req.url);
		console.log("bdPhoneGap.authorize(): req.query:", req.query);
		console.log("bdPhoneGap.authorize(): req.cookies:", req.cookies);
		var token = req.cookies.token || req.param('token');
		if (token) {
			req.token = token;
			next();
		} else {
			next (new HttpError('Missing authentication token', 401));
		}
	}
	app.use(makeExpressRoute('/op'), authorize.bind(this));
	app.use(makeExpressRoute('/api'), authorize.bind(this));

	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.<field>[], req.body.file[]
	var uploadDir = temp.path({prefix: 'com.palm.ares.hermes.bdPhoneGap'}) + '.d';
	fs.mkdirSync(uploadDir);
	app.use(express.bodyParser({keepExtensions: true, uploadDir: uploadDir}));

	/*
	 * Verbs
	 */

	// '/token' & '/api' -- Wrapped public Phonegap API
	app.post(makeExpressRoute('/token'), getToken);
	app.get(makeExpressRoute('/api/v1/me'), getUserData);
	
	// '/op' -- localy-implemented operations

	// Return the ZIP-ed deployed Enyo application
	app.post(makeExpressRoute('/op/deploy'), function(req, res, next) {
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
				cleanup.bind(this)(req, res, function() {
					next(err);
				});
			}
			// we do not invoke error-less next() here
			// because that would try to return 200 with
			// an empty body, while we have already sent
		});
	});

	// Upload ZIP-ed deployed Enyo application to the
	// https://build.phonegap.com online service and return the
	// JSON-encoded response of the service.
	app.post(makeExpressRoute('/op/build'), function(req, res, next) {
		async.series([
			prepare.bind(this, req, res),
			store.bind(this, req, res),
			deploy.bind(this, req, res),
			zip.bind(this, req, res),
			upload.bind(this, req, res),
			returnBody.bind(this, req, res),
			cleanup.bind(this, req, res)
		], function (err, results) {
			if (err) {
				// cleanup & run express's next() : the errorHandler
				cleanup.bind(this)(req, res, function() {
					next(err);
				});
			}
			// we do not invoke error-less next() here
			// because that would try to return 200 with
			// an empty body, while we have already sent
			// back the response.
		});
	});
	
	// Global error handler (last app.xxx(), with 4 parameters)
	function errorHandler(err, req, res, next){
		console.error("errorHandler(): err:", util.inspect(err));
		if (err instanceof Error) {
			var msg;
			try {
				msg = JSON.parse(err.message).error;
			} catch(e) {
				msg = err.message;
			}
			if ("Invalid authentication token." === msg) {
				_respond(new HttpError(msg, 401));
			} else {
				_respond(new HttpError(msg, 400));
			}
		} else {
			_respond(new Error(err.toString()));
		}

		function _respond(err) {
			console.error("errorHandler#_respond(): ", err.stack);
			res.status(err.statusCode || 500);
			if (err.statusCode === 401) {
				// invalidate token cookie
				addCookie(res, 'token', null);
			}
			res.contentType('txt'); // direct usage of 'text/plain' does not work
			res.send(err.toString());
		}
	}

	// express-3.x: middleware with arity === 4 is detected as the error handler
	app.use(errorHandler);

	// Send back the service location information (origin,
	// protocol, host, port, pathname) to the creator, when port
	// is bound
	server.listen(config.port, "127.0.0.1", null /*backlog*/, function() {
		var tcpAddr = server.address();
		return next(null, {
			protocol: 'http',
			host: tcpAddr.address,
			port: tcpAddr.port,
			origin: "http://" + tcpAddr.address + ":"+ tcpAddr.port,
			pathname: config.pathname
		});
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

		var appManifest = path.join(req.appDir.source, 'package.js');
		fs.stat(appManifest, function(err) {
			if (err) {
				// No top-level package.js: this is
				// not a Bootplate-based Enyo
				// application & we have no clue on
				// wether it is even an Enyo
				// application, so we cannot `deploy`
				// it easily.
				console.log("no '" + appManifest + "': not an Enyo Bootplate-based application");
				req.appDir.zipRoot = req.appDir.source;
				next();
			} else {
				req.appDir.zipRoot = req.appDir.deploy;

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
		});
	}

	function zip(req, res, next) {
		console.log("zip(): Zipping '" + req.appDir.zipRoot + "'");

		//console.log("zip(): ");
		req.zip = {};
		req.zip.path = path.join(req.appDir.root, "app.zip");
		req.zip.stream = zipstream.createZip({level: 1});
		req.zip.stream.pipe(fs.createWriteStream(req.zip.path));
		_walk.bind(this)(req.appDir.zipRoot, "" /*prefix*/, function() {
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
		//console.log("getToken(): req.body = ", util.inspect(req.body));

		var auth, options;
		auth = "Basic " + new Buffer(req.body.username + ':' +req.body.password).toString("base64");
		options = {
			url : 'https://' + url + "/token",
			headers : { "Authorization" : auth }
		};
		request.post(options, function(err1, response, body) {
			try {
				console.log("Bdphonegap.getToken(): response.statusCode:", response.statusCode);
				if (err1) {
					console.log(err1);
					next(new HttpError(err1.toString(), response.statusCode));
				} else {
					console.log("Bdphonegap.getToken(): body:", body);
					var data = JSON.parse(body);
					if (data.error) {
						next(new HttpError(data.error, 401));
					} else {
						addCookie(res, 'token', data.token);
						res.status(200).send(data).end();
					}
				}
			} catch(err0) {
				next(err0);
			}
		});
	}

	function getUserData(req, res, next) {
		client.auth({ token: req.token }, function(err1, api) {
			if (err1) {
				next(err1);
			} else {
				api.get('/me', function(err2, userData) {
					if (err2) {
						next(err2);
					} else {
						console.log("Bdphonegap.getUserData(): userData:", util.inspect(userData));
						res.status(200).send({user: userData}).end();
					}
				});
			}
		});;
	}

	function upload(req, res, next) {
		console.log("upload(): fields req.body = ", util.inspect(req.body));
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

		// Pick signing keys, if provided
		try {
			reqData.keys = JSON.parse(req.body.keys);
		} catch(e) {
			console.log("upload(): no valid signing keys");
		}

		// When the specific field 'testResponse'
		// (JSON-encoded) is present, the build request is not
		// presented to the outside build.phonegap.com
		// service.  This avoids eating build token in a
		// frequent test scenario.  The Hermes PhoneGap server
		// rather returns testResponse.
		if (req.body.testJsonResponse) {
			try {
				res.body = JSON.parse(req.body.testJsonResponse);
				next();
			} catch(err) {
				next(err);
			}
		} else if (req.body.appId) {
			console.log("upload(): updating appId="+ req.body.appId + " (title='" + req.body.title + "')");
			api.updateFileBasedApp(req.body.token, req.zip.path, req.body.appId, reqData, {
				success: next,
				error: _fail
			});
		} else {
			console.log("upload(): creating new appId for title=" + req.body.title + "");
			reqData.create_method = 'file';
			for (var p in req.body) {
				if (!reqData[p] && (typeof p === 'string')) {
					reqData[p] = req.body[p];
				}
			}
			console.log("upload(): reqData=", reqData);
			api.createFileBasedApp(req.body.token, req.zip.path, reqData, {
				success: _success,
				error: _fail
			});
		}
		
		function _success(data) {
			try {
				console.log("upload(): ", util.inspect(data));
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
		
		function _fail(err) {
			if (err instanceof Error) {
				console.error(err.stack);
			} else {
				console.error("upload(): error ", err);
			}
			next(new HttpError("PhoneGap build error: " + err.toString(), 400 /*Bad Request*/));
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

	var knownOpts = {
		"port":		Number,
		"pathname":	String,
		"level":	['silly', 'verbose', 'info', 'http', 'warn', 'error'],
		"help":		Boolean
	};
	var shortHands = {
		"p": "--port",
		"P": "--pathname",
		"l": "--level",
		"v": "--level verbose",
		"h": "--help"
	};
	var argv = require('nopt')(knownOpts, shortHands, process.argv, 2 /*drop 'node' & basename*/);
	argv.pathname = argv.pathname || "/phonegap";
	argv.port = argv.port || 0;
	argv.level = argv.level || "http";
	if (argv.help) {
		console.log("Usage: node " + basename + "\n" +
			    "  -p, --port        port (o) local IP port of the express server (0: dynamic)         [default: '0']\n" +
			    "  -P, --pathname    URL pathname prefix (before /deploy and /build                    [default: '/phonegap']\n" +
			    "  -l, --level       debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error') [default: 'http']\n" +
			    "  -h, --help        This message\n");
		process.exit(0);
	}

	new BdPhoneGap({
		pathname: argv.pathname,
		port: argv.port,
		enyoDir: path.resolve(__dirname, '..', 'enyo')
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
