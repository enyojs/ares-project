var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    child_process = require("child_process"),
    createDomain = require('domain').create,
    log = require('npmlog'),
    temp = require("temp"),
    http = require("http"),
    async = require("async"),
    mkdirp = require("mkdirp"),
    request = require('request'),
    rimraf = require("rimraf"),
    zipstream = require('zipstream'),
    CombinedStream = require('combined-stream'),
    HttpError = require("./httpError");

module.exports = BdBase;

/**
 * Base object for Ares build services
 * 
 * @param {Object} config
 * @property config {String} port requested IP port (0 for dynamic allocation, the default)
 * @property config {String} pathname location after the service origin, defaults to '/'
 * @property config {String} basename child class name (for tracing)
 * @property config {String} level tracing level (default to 'http')
 * @property config {Boolean} performCleanup clean temporary files & folders (default to true)
 * 
 * @param {Function} next
 * @param next {Error} err
 * @param next {Object} service
 * @property service {String} protocol is 'http' or 'https'
 * @property service {String} host IP address to 
 * @property service {String} port bound port (useful in case of dynamic allocation)
 * @property service {String} origin consolidated string of protocol, host & port
 * @property service {String} pathname to locat the service behind the origin
 * 
 * @public
 */
function BdBase(config, next) {

	config.port = config.port || 0;
	config.pathname = config.pathname || '/';
	config.level = config.level || 'http';
	if (config.performCleanup === undefined) config.performCleanup = true;

	this.config = config;
	log.info('BdBase()', "config:", this.config);

	// express 3.x: app is not a server
	this.app = express();
	this.server = http.createServer(this.app);

	/*
	 * Middleware -- applied to every verbs
	 */
	if (this.config.level !== 'error' && this.config.level !== 'warn') {
		this.app.use(express.logger('dev'));
	}

	/*
	 * Error Handling - Wrap exceptions in delayed handlers
	 */
	this.app.use(function(req, res, next) {
		var domain = createDomain();

		domain.on('error', function(err) {
			next(err);
			domain.dispose();
		});

		domain.enter();
		next();
	});

	// CORS -- Cross-Origin Resources Sharing
	this.app.use(function(req, res, next) {
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
	this.app.use(function(req, res, next) {
		if (req.connection.remoteAddress !== "127.0.0.1") {
			next(new Error("Access denied from IP address "+req.connection.remoteAddress));
		} else {
			next();
		}
	});

	this.use();

	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.<field>[], req.body.file[]
	this.uploadDir = temp.path({prefix: 'com.palm.ares.hermes.' + this.config.basename}) + '.d';
	fs.mkdirSync(this.uploadDir);
	this.app.use(express.bodyParser({keepExtensions: true, uploadDir: this.uploadDir}));

	/*
	 * verbs
	 */
	this.app.post('/config', (function(req, res, next) {
		this.configure(req.body && req.body.config, function(err) {
			res.status(200).end();
		});
	}).bind(this));

	this.app.post(this.makeExpressRoute('/op/archive'), this.archive.bind(this));
	this.app.post(this.makeExpressRoute('/op/build'), this.build.bind(this));

	this.route();

	/*
	 * error handling: express-3.x: middleware with arity === 4 is
	 * detected as the global error handler
	 */
	this.app.use(this.errorHandler.bind(this));

	// Send back the service location information (origin,
	// protocol, host, port, pathname) to the creator, when port
	// is bound
	this.server.listen(config.port, "127.0.0.1", null /*backlog*/, (function() {
		var tcpAddr = this.server.address();
		return next(null, {
			protocol: 'http',
			host: tcpAddr.address,
			port: tcpAddr.port,
			origin: "http://" + tcpAddr.address + ":"+ tcpAddr.port,
			pathname: config.pathname
		});
	}).bind(this));
}

/**
 * Make sane Express matching paths
 * @protected
 */
BdBase.prototype.makeExpressRoute = function(path) {
	return (this.config.pathname + path)
		.replace(/\/+/g, "/") // compact "//" into "/"
		.replace(/(\.\.)+/g, ""); // remove ".."
};

/**
 * @protected
 */
BdBase.prototype.configure = function(config, next) {
	log.silly("configure()", "old config:", this.config);
	log.silly("configure()", "inc config:", config);
	util._extend(this.config, config);
	log.verbose("configure()", "new config:", this.config);
	next();
};

/**
 * Additionnal middlewares: 'this.app.use(xxx)'
 * @protected
 */
BdBase.prototype.use = function(config, next) {
	log.verbose('BdBase#use()', "skipping..."); 
};

/**
 * Additionnal routes/verbs: 'this.app.get()', 'this.app.port()'
 * @protected
 */
BdBase.prototype.route = function(config, next) {
	log.verbose('BdBase#route()', "skipping..."); 
};

/**
 * @protected
 */
BdBase.prototype.setCookie = function(res, key, value) {
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

/**
 * Global error handler (arity === 4)
 * @protected
 */
BdBase.prototype.errorHandler = function(err, req, res, next){
	log.error("errorHandler()", err.stack);
	res.status(err.statusCode || 500);
	res.contentType('txt'); // direct usage of 'text/plain' does not work
	res.send(err.toString());
	this.cleanup(req, res, next);
};

/**
 * @protected
 */
BdBase.prototype.answerOk = function(req, res, next) {
	log.verbose("answerOk()", '200 OK');
	res.status(200).send();
};

/**
 * @protected
 */
BdBase.prototype.prepare = function(req, res, next) {
	var appTempDir = temp.path({prefix: 'com.palm.ares.hermes.' + this.config.basename + '.'}) + '.d';
	req.appDir = {
		root: appTempDir,
		source: path.join(appTempDir, 'source'),
		build: path.join(appTempDir, 'build'),
		minify: path.join(appTempDir, 'minify')
	};
	
	log.verbose("prepare()", "setting-up " + req.appDir.root);
	async.series([
		function(done) { mkdirp(req.appDir.root, done); },
		function(done) { fs.mkdir(req.appDir.source, done); },
		function(done) { fs.mkdir(req.appDir.build, done); },
		function(done) { fs.mkdir(req.appDir.minify, done); }
	], next);
};

/**
 * @protected
 */
BdBase.prototype.store = function(req, res, next) {
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
				if (file.type.match(/x-encoding=base64/)) {
					fs.readFile(file.path, function(err, data) {
						if (err) {
							log.info("store()", "transcoding: error" + file.path, err);
							cb(err);
							return;
						}
						try {
							var fpath = file.path;
							delete file.path;
							fs.unlink(fpath, function(err) { /* Nothing to do */ });
							
							var filedata = new Buffer(data.toString('ascii'), 'base64');			// TODO: This works but I don't like it
							fs.writeFile(path.join(req.appDir.source, file.name), filedata, function(err) {
								log.silly("store()", "from base64(): Stored: ", file.name);
								cb(err);
							});
						} catch(transcodeError) {
							log.warn("store()", "transcoding error: " + file.path, transcodeError);
							cb(transcodeError);
						}
					}.bind(this));
				} else {
					fs.rename(file.path, path.join(req.appDir.source, file.name), function(err) {
						log.silly("store()", "Stored: ", file.name);
						cb(err);
					});
				}
			}
		});
	}, next);
};

/**
 * @protected
 */
BdBase.prototype.minify = function(req, res, next) {
	// 'this' context not available in nested functions?
	var enyoDir = this.config.enyoDir,
	    minifyScript = this.config.minifyScript;

	if (req.query["no-minify"]) {
		_noMinify();
		return;
	}

	var appManifest = path.join(req.appDir.source, 'package.js');
	fs.stat(appManifest, function(err) {
		if (err) {
			// No top-level package.js: this is not a
			// Bootplate-based Enyo application & we have
			// no clue on wether it is even an Enyo
			// application, so we cannot `deploy` it
			// easily.
			log.info("minify()", "no '" + appManifest + "': not an Enyo Bootplate-based application");
			_noMinify();
		} else {
			_minify();
		}
	});

	function _noMinify() {
		req.appDir.zipRoot = req.appDir.source;
		next();
	}

	function _minify() {
		req.appDir.zipRoot = req.appDir.minify;
		
		// Execute the deploy.js script that comes with Enyo.
		// 
		// TODO: scalable processing is better acheived using
		// VM <http://nodejs.org/api/vm.html> rather than
		// child-processes
		// <http://nodejs.org/api/child_process.html>.
		var params = [ '--verbose',
			       '--packagejs', path.join(req.appDir.source, 'package.js'),
			       '--source', req.appDir.source,
			       '--enyo', enyoDir,
			       '--build', req.appDir.build,
			       '--out', req.appDir.minify,
			       '--less'];
		log.info("minify()", "Running: '", minifyScript, params.join(' '), "'");
		var child = child_process.fork(minifyScript, params, {
			silent: false
		});
		child.on('message', function(msg) {
			log.verbose("minify()", msg);
			if (msg.error) {
				log.error("minify()", "child-process error: ", msg.error);
				child.errMsg = msg.error;
			} else {
				log.warn("minify()", "unexpected child-process message msg=", msg);
			}
		});
		child.on('exit', function(code, signal) {
			if (code !== 0) {
				next(new HttpError(child.errMsg || ("child-process failed: '"+ child.toString() + "'")));
			} else {
				log.info("minify(): completed");
				next();
			}
		});
	}
};

/**
 * @protected
 */
BdBase.prototype.build = function(req, res, next) {
	log.verbose("build()");
	next(new HttpError("Not implemented", 500));
	/*
	// Example
	async.series([
		this.prepare.bind(this, req, res),
		this.store.bind(this, req, res),
		this.package.bind(this, req, res),
		this.returnFormData.bind(this, req, res),
		this.cleanup.bind(this, req, res)
	], function (err, results) {
		if (err) {
			// run express's next() : the errorHandler (which calls cleanup)
			next(err);
		}
		// we do not invoke error-less next() here
		// because that would try to return 200 with
		// an empty body, while we have already sent
		// back the response.
	});
	 */
};

/**
 * @protected
 */
BdBase.prototype.archive = function(req, res, next) {
	log.verbose("archive()");
	async.series([
		this.prepare.bind(this, req, res),
		this.store.bind(this, req, res),
		this.minify.bind(this, req, res),
		this.zip.bind(this, req, res),
		this.returnZip.bind(this, req, res),
		this.cleanup.bind(this, req, res)
	], function (err, results) {
		if (err) {
			// run express's next() : the errorHandler (which calls cleanup)
			next(err);
		}
		// we do not invoke error-less next() here
		// because that would try to return 200 with
		// an empty body, while we have already sent
		// back the response.
	});
};

/**
 * @protected
 */
BdBase.prototype.zip = function(req, res, next) {
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
};

/**
 * @protected
 */
BdBase.prototype.returnZip = function(req, res, next) {
	res.status(200).sendfile(req.zip.path);
	delete req.zip;
	next();
};

/**
 * @protected
 */
BdBase.prototype.returnBody = function(req, res, next) {
	if (res.contentType) {
		// Otherwise count on express to detect the
		// content-type
		res.header('content-type', res.contentType);
	}
	res.status(200).send(res.body);
	delete res.body;
	delete res.contentType;
	next();
};

/**
 * @protected
 */
BdBase.prototype.returnFormData = function(req, res, next) {
	var filename = req.filename;
	var stats = fs.statSync(filename);
	log.verbose("returnFormData()", "size: " + stats.size + " bytes", filename);
	
	// Build the multipart/formdata
	var combinedStream = CombinedStream.create();
	var boundary = _generateBoundary();
	
	// Adding part header
	combinedStream.append(_getPartHeader(path.basename(filename)));
	// Adding file data
	combinedStream.append(function(nextDataChunk) {
		fs.readFile(filename, 'base64', function (err, data) {
			if (err) {
				next('Unable to read ' + filename);
				nextDataChunk('INVALID CONTENT');
			} else {
				nextDataChunk(data);
			}
		});
	});
	
	// Adding part footer
	combinedStream.append(_getPartFooter());
	
	// Adding last footer
	combinedStream.append(_getLastPartFooter());
	
	// Send the files back as a multipart/form-data
	res.status(200);
	res.header('Content-Type', _getContentTypeHeader());
	combinedStream.pipe(res);
	
	// cleanup the temp dir when the response has been sent
	combinedStream.on('end', function() {
		next();
	});

	var FORM_DATA_LINE_BREAK = '\r\n';

	function _generateBoundary() {
		// This generates a 50 character boundary similar to those used by Firefox.
		// They are optimized for boyer-moore parsing.
		var boundary = '--------------------------';
		for (var i = 0; i < 24; i++) {
			boundary += Math.floor(Math.random() * 10).toString(16);
		}

		return boundary;
	}

	function _getContentTypeHeader() {
		return 'multipart/form-data; boundary=' + boundary;
	}

	function _getPartHeader(filename) {
		var header = '--' + boundary + FORM_DATA_LINE_BREAK;
		header += 'Content-Disposition: form-data; name="file"';

		header += '; filename="' + filename + '"' + FORM_DATA_LINE_BREAK;
		header += 'Content-Type: application/octet-stream; x-encoding=base64';

		header += FORM_DATA_LINE_BREAK + FORM_DATA_LINE_BREAK;
		return header;
	}

	function _getPartFooter() {
		return FORM_DATA_LINE_BREAK;
	}

	function _getLastPartFooter() {
		return '--' + boundary + '--';
	}
};

/**
 * @protected
 */
BdBase.prototype.cleanup = function(req, res, next) {
	var dir = req.appDir && req.appDir.root;
	if (this.config.performCleanup && dir) {
		log.verbose("cleanup()", "rm -rf " + dir);
		rimraf(req.appDir.root, function(err) {
			log.verbose("cleanup()", "removed " + dir);
			delete req.appDir;
			next(err);
		});
	} else {
		log.verbose("cleanup()", "skipping removal of " + dir);
		next();
	}
};

/**
 * Terminates express server & clean-up the plate
 * @protected
 */
BdBase.prototype.quit = function(cb) {
	this.app.close();
	rimraf(this.uploadDir, cb);
	log.info('quit()',  "exiting");
};

/**
 * @protected
 */
BdBase.prototype.onExit = function() {
	rimraf(this.uploadDir, function(err) {
		// Nothing to do
	});
};
