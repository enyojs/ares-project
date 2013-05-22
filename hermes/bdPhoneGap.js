/**
 * Hermes PhoneGap build service
 */

// nodejs version checking is done in parent process ide.js

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    npmlog = require('npmlog'),
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

var basename = path.basename(__filename, '.js'),
    log = npmlog;
log.heading = basename;
log.level = 'warn';

var url = 'build.phonegap.com';

process.on('uncaughtException', function (err) {
	log.error('uncaughtException', err.stack);
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

	this.config = config;

	// (simple) parameters checking
	this.config.pathname = config.pathname || '/phonegap';

	var deployScript = path.join(this.config.enyoDir, 'tools', 'deploy.js');
	try {
		var stat = fs.statSync(deployScript);
		if (!stat.isFile()) throw "Not a file";
	} catch(e) {
		// Build a more usable exception
		next(new Error("Not a suitable Enyo: it does not contain a usable 'tools/deploy.js'"));
	}

	log.verbose('main', "config",  this.config);

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

	app.use(function(req, res, next) {
		if (req.connection.remoteAddress !== "127.0.0.1") {
			next(new Error("Access denied from IP address "+req.connection.remoteAddress));
		} else {
			next();
		}
	});

	function authorize(req, res, next) {
		log.verbose("authorize()", "req.url:", req.url);
		log.verbose("authorize()", "req.query:", req.query);
		log.verbose("authorize()", "req.cookies:", req.cookies);
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

	app.post('/config', (function(req, res, next) {
		this.configure(req.body && req.body.config, function(err) {
			res.status(200).end();
		});
	}).bind(this));

	// '/token' & '/api' -- Wrapped public Phonegap API
	app.post(makeExpressRoute('/token'), getToken.bind(this));
	app.get(makeExpressRoute('/api/v1/me'), getUserData.bind(this));
	
	// '/op' -- localy-implemented operations

	// Return the ZIP-ed deployed Enyo application
	app.post(makeExpressRoute('/op/deploy'), (function(req, res, next) {
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
	}).bind(this));

	// Upload ZIP-ed deployed Enyo application to the
	// https://build.phonegap.com online service and return the
	// JSON-encoded response of the service.
	app.post(makeExpressRoute('/op/build'), (function(req, res, next) {
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
	}).bind(this));
	
	// Global error handler (last app.xxx(), with 4 parameters)
	function errorHandler(err, req, res, next){
		log.info("errorHandler()", "err:", err);
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
			log.warn("errorHandler#_respond():", err.stack);
			res.status(err.statusCode || 500);
			if (err.statusCode === 401) {
				// invalidate token cookie
				this.setCookie(res, 'token', null);
			}
			res.contentType('txt'); // direct usage of 'text/plain' does not work
			res.send(err.toString());
		}
	}

	// express-3.x: middleware with arity === 4 is detected as the error handler
	app.use(errorHandler.bind(this));

	// Send back the service location information (origin,
	// protocol, host, port, pathname) to the creator, when port
	// is bound
	server.listen(this.config.port, "127.0.0.1", null /*backlog*/, (function() {
		var tcpAddr = server.address();
		return next(null, {
			protocol: 'http',
			host: tcpAddr.address,
			port: tcpAddr.port,
			origin: "http://" + tcpAddr.address + ":"+ tcpAddr.port,
			pathname: this.config.pathname
		});
	}).bind(this));

	/**
	 * Terminates express server & clean-up the plate
	 */
	this.quit = function(cb) {
		app.close();
		rimraf(uploadDir, cb);
		log.info('quit()',  "exiting");
	};

	function prepare(req, res, next) {
		var appTempDir = temp.path({prefix: 'com.palm.ares.hermes.bdPhoneGap.'}) + '.d';
		req.appDir = {
			root: appTempDir,
			source: path.join(appTempDir, 'source'),
			build: path.join(appTempDir, 'build'),
			deploy: path.join(appTempDir, 'deploy')
		};

		log.verbose("prepare()", "setting-up " + req.appDir.root);
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
			log.silly("store()", "mkdir -p ", dir);
			mkdirp(dir, function(err) {
				log.silly("store()", "mv ", file.path, " ", file.name);
				if (err) {
					cb(err);
				} else {
					fs.rename(file.path, path.join(req.appDir.source, file.name), function(err) {
						log.verbose("store()", "Stored: ", file.name);
						cb(err);
					});
				}
			});
		}, next);
	}

	function deploy(req, res, next) {
		var appManifest = path.join(req.appDir.source, 'package.js');
		fs.stat(appManifest, function(err) {
			if (err) {
				// No top-level package.js: this is
				// not a Bootplate-based Enyo
				// application & we have no clue on
				// wether it is even an Enyo
				// application, so we cannot `deploy`
				// it easily.
				log.info("deploy()", "no '" + appManifest + "': not an Enyo Bootplate-based application");
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
					       '--enyo', this.config.enyoDir,
					       '--build', req.appDir.build,
					       '--out', req.appDir.deploy,
					       '--less'];
				log.info("deploy()", "Running: '", deployScript, params.join(' '), "'");
				var child = child_process.fork(deployScript, params, {
					silent: false
				});
				child.on('message', function(msg) {
					log.verbose("deploy()", msg);
					if (msg.error) {
						log.error("deploy()", "child-process error: ", msg.error);
						child.errMsg = msg.error;
					} else {
						log.warn("deploy()", "unexpected child-process message msg=", msg);
					}
				});
				child.on('exit', function(code, signal) {
					if (code !== 0) {
						next(new HttpError(child.errMsg || ("child-process failed: '"+ child.toString() + "'")));
					} else {
						log.info("deploy(): completed");
						next();
					}
				});
			}
		});
	}

	function zip(req, res, next) {
		log.info("zip()", "Zipping '" + req.appDir.zipRoot + "'");

		req.zip = {};
		req.zip.path = path.join(req.appDir.root, "app.zip");
		req.zip.stream = zipstream.createZip({level: 1});
		req.zip.stream.pipe(fs.createWriteStream(req.zip.path));
		_walk.bind(this)(req.appDir.zipRoot, "" /*prefix*/, function() {
			try {
				req.zip.stream.finalize(function(written){
					log.verbose("zip()", "finished ", req.zip.path);
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
			log.silly("zip._walk()", "Parsing: ", relParent);
			async.waterfall([
				function(cb2) {
					log.silly("zip._walk()", "readdir: ", absParent);
					fs.readdir(absParent, cb2);
				},
				function(nodes, cb2) {
					log.silly("zip._walk()", "nodes.forEach");
					async.forEachSeries(nodes, function(name, cb3) {
						var absPath = path.join(absParent, name),
						    relPath = path.join(relParent, name);
						log.silly("zip._walk()", "stat: ", absPath);
						fs.stat(absPath, function(err, stat) {
							if (err) {
								cb3(err);
								return;
							}
							if (stat.isDirectory()) {
								_walk(absPath, relPath, cb3);
							} else {
								log.silly("zip._walk()", "Adding: ", relPath);
								try {
									req.zip.stream.addFile(fs.createReadStream(absPath), { name: relPath }, function(err) {
										log.verbose("zip._walk()", "Added: ", relPath, "(err=", err, ")");
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
		//log.silly("getToken()", "req.body:", req.body);

		var auth, options;
		auth = "Basic " + new Buffer(req.body.username + ':' +req.body.password).toString("base64");
		options = {
			url : 'https://' + url + "/token",
			headers : { "Authorization" : auth },
			proxy: this.config.proxyUrl
		};
		log.http("getToken()", "POST /token");
		request.post(options, (function(err1, response, body) {
			try {
				log.verbose("getToken()", "response.statusCode:", response.statusCode);
				if (err1) {
					log.warn("getToken()", err1.toString());
					next(new HttpError(err1.toString(), response.statusCode));
				} else {
					log.verbose("getToken()", "response body:", body);
					var data = JSON.parse(body);
					if (data.error) {
						next(new HttpError(data.error, 401));
					} else {
						this.setCookie(res, 'token', data.token);
						res.status(200).send(data).end();
					}
				}
			} catch(err0) {
				next(err0);
			}
		}).bind(this));
	}

	function getUserData(req, res, next) {
		client.auth({
			token: req.token,
			proxy: this.config.proxyUrl
		}, function(err1, api) {
			if (err1) {
				next(err1);
			} else {
				api.get('/me', function(err2, userData) {
					if (err2) {
						next(err2);
					} else {
						log.info("getUserData()", "userData:", userData);
						res.status(200).send({user: userData}).end();
					}
				});
			}
		});;
	}

	function upload(req, res, next) {
		log.info("upload()", "title:", req.body.title, ", platforms:", req.body.platforms, ", appId:", req.body.appId);

		async.waterfall([
			client.auth.bind(this, {
				token: req.token,
				proxy: this.config.proxyUrl
			}),
			_prepare.bind(this),
			_uploadApp.bind(this),
			_success.bind(this)
		], function(err, result) {
			if (err) {
				_fail(err);
			} else {
				next();
			}
		});

		function _prepare(api, next) {
			var appData = {}, errs = [];
			// check mandatory parameters
			var mandatory = ['token', 'title'];
			mandatory.forEach(function(field) {
				if (!req.body[field]) {
					errs.push("Missing form field: '" + field + "'");
				}
			});
			if (errs.length > 0) {
				next(new HttpError(errs.toString(), 400));
				return;
			}
			// picks signing keys ID's, if any
			try {
				appData.keys = JSON.parse(req.body.keys);
			} catch(e) {
				log.info("upload#_prepare()", "un-signed build requested (did not find a valid signing key)");
			}
			// pass other form parameters as 1st-level
			// property of the build request object.
			for (var p in req.body) {
				if (!appData[p] && (typeof p === 'string')) {
					appData[p] = req.body[p];
				}
			}
			//WARNING: enabling this trace shows-up the signing keys passwords
			log.silly("upload#_prepare(): appData:", appData);
			next(null, api, appData);
		}
		function _uploadApp(api, appData, next) {
			var options = {
				form: {
					data: appData,
					file: req.zip.path
				}
			};
			if (appData.appId) {
				log.http("upload#_uploadApp()", "PUT /apps/" + appData.appId + " (title='" + appData.title + "')");
				api.put('/apps/' + appData.appId, options, next);

			} else {
				log.http("upload#_uploadApp()", "POST /apps (title='" + appData.title + "')");
				options.form.data.create_method = 'file';
				api.post('/apps', options, next);
			}
		}

		function _success(data, next) {
			try {
				log.verbose("upload#_success()", "data", data);
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
				_fail(e);
			}
		}
		
		function _fail(err) {
			log.warn("upload#_fail()", "error ", err);
			next(new HttpError("PhoneGap build error: " + err.toString(), 400 /*Bad Request*/));
		}
	}
	
	function returnZip(req, res, next) {
		res.status(200).sendfile(req.zip.path);
		delete req.zip;
		next();
	}

	function returnBody(req, res, next) {
		res.status(200).send(res.body);
		delete res.body;
		next();
	}

	function cleanup(req, res, next) {
		log.info("cleanup()", "rm -rf " + req.appDir.root);
		rimraf(req.appDir.root, function(err) {
			log.verbose("cleanup()", "removed " + req.appDir.root);
			next(err);
		});
	}
}

BdPhoneGap.prototype.configure = function(config, next) {
	util._extend(this.config, config);
	log.verbose("configure()", "config:", this.config);
	next();
};

BdPhoneGap.prototype.setCookie = function(res, key, value) {
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + 10 /*days*/);
	var cookieOptions = {
		domain: '127.0.0.1:' + this.config.port,
		path: this.config.pathname,
		httpOnly: true,
		expires: exdate
		//maxAge: 1000*3600 // 1 hour
	};
	res.cookie(key, value, cookieOptions);
	log.info('setCookie()', "Set-Cookie: " + key + ":", value || "");
};

if (path.basename(process.argv[1], '.js') === basename) {
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
	var helpString = [
		"Usage: node " + basename,
		"  -p, --port        port (o) local IP port of the express server (0: dynamic)         [default: '0']",
		"  -P, --pathname    URL pathname prefix (before /deploy and /build                    [default: '/phonegap']",
		"  -l, --level       debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error') [default: 'http']",
		"  -h, --help        This message"
	];
	var argv = require('nopt')(knownOpts, shortHands, process.argv, 2 /*drop 'node' & basename*/);
	argv.pathname = argv.pathname || "/phonegap";
	argv.port = argv.port || 0;
	log.level = argv.level || "http";
	if (argv.help) {
		helpString.forEach(function(line) {
			console.log(line);
		});
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
