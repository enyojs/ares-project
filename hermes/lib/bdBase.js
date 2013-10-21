/*jshint node: true, strict: false, globalstrict: false */

var fs = require("graceful-fs"),
    path = require("path"),
    util  = require("util"),
    child_process = require("child_process"),
    log = require('npmlog'),
    temp = require("temp"),
    async = require("async"),
    mkdirp = require("mkdirp"),
    rimraf = require("rimraf"),
    archiver = require('archiver'),
    HttpError = require("./httpError"),
    ServiceBase = require("./svcBase");

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
	config.timeout = config.timeout || (2*60*1000);
	if (config.performCleanup === undefined) {
		config.performCleanup = true;
	}
	ServiceBase.call(this, config, next);
}

util.inherits(BdBase, ServiceBase);

/**
 * Additionnal middlewares: 'this.app.use(xxx)'
 * @protected
 */
BdBase.prototype.use = function() {
	log.verbose('BdBase#use()'); 
};

BdBase.prototype.cleanProcess = function(next) {
	log.verbose('BdBase#cleanProcess()');
	setImmediate(next);
};

/**
 * Additionnal routes/verbs: 'this.app.get()', 'this.app.port()'
 * @protected
 */
BdBase.prototype.route = function() {
	log.verbose('BdBase#route()'); 
	this.app.post(this.makeExpressRoute('/op/archive'), this.archive.bind(this));
	this.app.post(this.makeExpressRoute('/op/build'), this.build.bind(this));
};

/**
 * @protected
 */
BdBase.prototype.configure = function(config, next) {
	log.silly("BdBase#configure()", "old config:", this.config);
	log.silly("BdBase#configure()", "inc config:", config);
	util._extend(this.config, config);
	log.verbose("BdBase#configure()", "new config:", this.config);
	setImmediate(next);
};

/**
 * @protected
 */
BdBase.prototype.prepare = function(req, res, next) {
	var appTempDir = temp.path({prefix: 'com.palm.ares.hermes.' + this.config.basename + '.'}) + '.d';
	req.appDir = {
		root: appTempDir,
		source: path.join(appTempDir, 'source'),
		minify: path.join(appTempDir, 'minify')
	};
	req.storeDir = req.appDir.source;
	
	log.verbose("BdBase#prepare()", "setting-up " + req.appDir.root);
	async.series([
		function(done) { mkdirp(req.appDir.root, done); },
		function(done) { fs.mkdir(req.appDir.source, done); },
		function(done) { fs.mkdir(req.appDir.minify, done); }
	], next);
};

/**
 * Bdbase#minify method takes 2 request query parameters:
 * 
 * - "debug" is one of ["true", "false"] (default: "false").  When true, the code is not minified.
 * - "excludes" is an Array of relative path to be removed from the archive uploaded to PGB. "excludes"
 *   is ignored when "debug" is "false".
 * 
 * @protected
 */
BdBase.prototype.minify = function(req, res, next) {
	// 'this' context not available in nested functions?
	var minifyScript = this.config.minifyScript;

	if (req.query["debug"] === "true") {
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
			log.info("BdBase#minify()", "no '" + appManifest + "': not an Enyo Bootplate-based application");
			_noMinify();
		} else {
			_minify();
		}
	});

	function _noMinify() {
		log.info("BdBase#minify#_noMinify()", "Skipping minification");

		var excludes;
		try {
			excludes = JSON.parse(req.query["excludes"]);
			excludes = Array.isArray(excludes) && excludes;
		} catch(e) {}
		excludes = excludes || ["target", "build"];

		req.appDir.zipRoot = req.appDir.source;
		var index = path.join(req.appDir.zipRoot, "index.html"),
		    debug = path.join(req.appDir.zipRoot, "debug.html");
		async.waterfall([
			async.forEach.bind(this, excludes, function(exclude, next) {
				var absExclude = path.join(req.appDir.zipRoot, exclude);
				log.verbose("BdBase#minify#_noMinify()", "rm -rf", absExclude);
				rimraf(absExclude, next);
			}),
			fs.stat.bind(this, debug),
			function(stat, next) {
				log.verbose("BdBase#minify#_noMinify()", "mv debug.html index.html");
				fs.unlink(index, next);
			},
			fs.rename.bind(this, debug, index)
		], function(err) {
			if (err) {
				log.verbose("BdBase#ignoring err:", err.toString());
			}
			next();
		});
	}

	function _minify() {
		req.appDir.zipRoot = req.appDir.minify;
		
		// Execute the deploy.js script that comes with Enyo.
		// 
		// TODO: scalable processing is better acheived using
		// VM <http://nodejs.org/api/vm.html> rather than
		// child-processes
		// <http://nodejs.org/api/child_process.html>.
		var params = [ '--verbose', // XXX only if level >= verbose
			       '--source', req.appDir.source,
			       '--out', req.appDir.minify,
			       '--less'];
		log.info("BdBase#minify#_minify()", "Running: '", minifyScript, params.join(' '), "'");
		var child = child_process.fork(minifyScript, params, {
			silent: false
		});
		child.on('message', function(msg) {
			log.verbose("BdBase#minify()", msg);
			if (msg.error) {
				log.error("BdBase#minify()", "child-process error: ", msg.error);
				child.errMsg = msg.error;
			} else {
				log.warn("BdBase#minify()", "unexpected child-process message msg=", msg);
			}
		});
		child.on('exit', function(code /*, signal*/) {
			if (code !== 0) {
				next(new HttpError(child.errMsg || ("child-process failed: '"+ child.toString() + "'")));
			} else {
				log.info("BdBase#minify(): completed");
				next();
			}
		});
	}
};

/**
 * @protected
 */
BdBase.prototype.build = function(req, res, next) {
	log.verbose("BdBase#build()");
	setImmediate(next, new HttpError("Not implemented", 500));
	/*
	// Example
	async.series([
		this.prepare.bind(this, req, res),
		this.store.bind(this, req, res),
		this.package.bind(this, req, res),
		this.returnFormData.bind(this, [], res),
		this.cleanSession.bind(this, req, res)
	], function (err, results) {
		if (err) {
			// run express's next() : the errorHandler (which calls cleanSession)
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
	log.verbose("BdBase#archive()");
	async.series([
		this.prepare.bind(this, req, res),
		this.store.bind(this, req, res),
		this.minify.bind(this, req, res),
		this.zip.bind(this, req, res),
		this.returnZip.bind(this, req, res),
		this.cleanSession.bind(this, req, res)
	], function (err /*, results*/) {
		if (err) {
			// run express's next() : the errorHandler (which calls cleanSession)
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
	log.info("BdBase#zip()", "Zipping '" + req.appDir.zipRoot + "'");
	req.zip = {};
	req.zip.path = path.join(req.appDir.root, "app.zip");
	req.zip.stream = archiver.createZip({level: 1});
	req.zip.stream.pipe(fs.createWriteStream(req.zip.path));
	_walk.bind(this)(req.appDir.zipRoot, "" /*prefix*/, function(err) {
		if (err) {
			setImmediate(next, err);
			return;
		}
		try {
			req.zip.stream.finalize(function(written){
				log.verbose("BdBase#zip()", "finished:", req.zip.path, "(" + written + " bytes)");
				setImmediate(next);
			});
		} catch(e) {
			setImmediate(next, e);
		}
	});
	
	function _walk(absParent, relParent, next) {
		// TODO that _thing_ probably needs a bit of
		// refactoring by someone that feels easy with
		// node-async _arcanes_.
		log.silly("BdBase#zip._walk()", "Parsing: ", relParent);
		async.waterfall([
			function(next) {
				log.silly("BdBase#zip._walk()", "readdir: ", absParent);
				fs.readdir(absParent, next);
			},
			function(nodes, next) {
				log.silly("BdBase#zip._walk()", "nodes.forEach");
				async.forEachSeries(nodes, function(name, next) {
					var absPath = path.join(absParent, name),
					    relPath = path.join(relParent, name);
					log.silly("BdBase#zip._walk()", "stat: ", absPath);
					fs.stat(absPath, function(err, stat) {
						if (err) {
							next(err);
							return;
						}
						if (stat.isDirectory()) {
							_walk(absPath, relPath, next);
						} else {
							log.silly("BdBase#zip._walk()", "Adding: ", relPath);
							try {
								req.zip.stream.addFile(fs.createReadStream(absPath), { name: relPath }, function(err) {
									log.verbose("BdBase#zip._walk()", "Added: ", relPath, "(err=", err, ")");
									setImmediate(next, err);
								});
							} catch(e) {
								setImmediate(next, err);
							}
						}
					});
				}, next);
			}
		], next);
	}
};

/**
 * @protected
 */
BdBase.prototype.returnZip = function(req, res, next) {
	res.status(200).sendfile(req.zip.path);
	delete req.zip;
	setImmediate(next);
};

/**
 * @protected
 */
BdBase.prototype.cleanSession = function(req, res, next) {
	var dir = req.appDir && req.appDir.root;
	if (this.config.performCleanup && dir) {
		log.verbose("BdBase#cleanSession()", "rm -rf " + dir);
		rimraf(req.appDir.root, function(err) {
			log.verbose("BdBase#cleanSession()", "removed", dir);
			delete req.appDir;
			next(err);
		});
	} else {
		log.verbose("BdBase#cleanSession()", "skipping removal of", dir);
		setImmediate(next);
	}
};
