/*jshint node: true, strict: false, globalstrict: false */

/**
 * PhoneGap build service
 */

// nodejs version checking is done in parent process ide.js

var fs = require("graceful-fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    log = require('npmlog'),
    temp = require("temp"),
    request = require('request'),
    async = require("async"),
    http = require("http"),
    client = require("phonegap-build-api"),
    copyFile = require('./lib/copyFile'),
    BdBase = require("./lib/bdBase"),
    HttpError = require("./lib/httpError");

var basename = path.basename(__filename, '.js');

log.heading = basename;

var PGB_URL = 'https://build.phonegap.com',
    PGB_TIMEOUT = 7000;

function BdPhoneGap(config, next) {
	config.pathname = config.pathname || '/phonegap';

	config.minifyScript = config.minifyScript || path.join(config.enyoDir, 'tools', 'deploy.js');
	try {
		var stat = fs.statSync(config.minifyScript);
		if (!stat.isFile()) {
			throw "Not a file";
		}
	} catch(e) {
		// Build a more usable exception
		setImmediate(next, new Error("Not a suitable Enyo: it does not contain a usable 'tools/deploy.js'"));
	}

	BdBase.call(this, config, next);
	log.verbose('BdPhoneGap()', "config:",  this.config);
}
util.inherits(BdPhoneGap, BdBase);

BdPhoneGap.prototype.use = function() {
	BdBase.prototype.use.call(this);

	log.verbose('BdPhoneGap#use()'); 
	this.app.use(express.cookieParser());

	this.app.use(this.makeExpressRoute('/op'), authorize.bind(this));
	this.app.use(this.makeExpressRoute('/api'), authorize.bind(this));

	function authorize(req, res, next) {
		log.verbose("BdPhoneGap#authorize()", "req.url:", req.url);
		log.verbose("BdPhoneGap#authorize()", "req.query:", req.query);
		log.verbose("BdPhoneGap#authorize()", "req.cookies:", req.cookies);
		var token = req.cookies.token || req.param('token');
		if (token) {
			req.token = token;
			setImmediate(next);
		} else {
			setImmediate(next, new HttpError('Missing authentication token', 401));
		}
	}
};

BdPhoneGap.prototype.route = function() {
	BdBase.prototype.route.call(this);

	log.verbose('BdPhoneGap#route()'); 
	// '/token' & '/api' -- Wrapped public Phonegap API
	this.app.post(this.makeExpressRoute('/token'), this.getToken.bind(this));
	this.app.get(this.makeExpressRoute('/api/v1/me'), this.getUserData.bind(this));
	this.app.get(this.makeExpressRoute('/api/v1/apps/:appId'), this.getAppStatus.bind(this));
	this.app.get(this.makeExpressRoute('/api/v1/apps/:appId/:platform/:title/:version'), this.downloadApp.bind(this));
};

// it is not possible to reduce the number of parameters of
// this function, otherwise is not recognized as the error-handler by
// express... (jshint)
BdPhoneGap.prototype.errorHandler = function(err, req, res, next){
	var self = this;
	log.info("BdPhoneGap#errorHandler()", "err:", err);
	if (err instanceof HttpError) {
		_respond(err);
	} else if (err instanceof Error) {
		var msg;
		try {
			msg = JSON.parse(err.message).error;
		} catch(e) {
			msg = err.message;
		}
		if (("Invalid authentication token." === msg) ||
		    ("Missing authentication token" === msg)){
			_respond(new HttpError(msg, 401));
		} else {
			_respond(new HttpError(msg, 500));
		}
	} else {
		_respond(new Error(err.toString()));
	}
	
	function _respond(err) {
		log.warn("BdPhoneGap#errorHandler#_respond():", err.stack);
		var statusCode = (err && err.statusCode) || 500;
		res.status(statusCode);
		if (statusCode === 401) {
			// invalidate token cookie
			self.setCookie(res, 'token', null);
		}
		if (err.contentType) {
			res.contentType(err.contentType);
			res.send(err.message);
		} else {
			res.contentType('txt'); // direct usage of 'text/plain' does not work
			res.send(err.toString());
		}
	}
};

BdPhoneGap.prototype.getToken = function(req, res, next) {
	// XXX !!! leave this log commented-out to not log password !!!
	//log.silly("BdPhoneGap#getToken()", "req.body:", req.body);

	var timeout = req.param('timeout') || this.config.timeout || PGB_TIMEOUT;
	var auth, options;
	auth = "Basic " + new Buffer(req.body.username + ':' +req.body.password).toString("base64");
	options = {
		url : PGB_URL + "/token",
		headers : { "Authorization" : auth },
		proxy: this.config.proxyUrl,
		timeout: timeout
	};
	log.http("BdPhoneGap#getToken()", "POST /token");
	request.post(options, (function(err1, response, body) {
		try {
			var statusCode = (response && response.statusCode) || 0;
			log.verbose("BdPhoneGap#getToken()", "statusCode:", statusCode);
			if (err1 || statusCode != 200) {
				var msg = (err1 && err1.toString()) || http.STATUS_CODES[statusCode] || "Error";
				log.warn("BdPhoneGap#getToken()", msg);
				setImmediate(next, new HttpError(msg, statusCode));
			} else {
				log.verbose("BdPhoneGap#getToken()", "response body:", body);
				var data = JSON.parse(body);
				if (data.error) {
					setImmediate(next, new HttpError(data.error, 401));
				} else {
					this.setCookie(res, 'token', data.token);
					res.status(200).send(data).end();
				}
			}
		} catch(err0) {
			setImmediate(next, err0);
		}
	}).bind(this));
};

BdPhoneGap.prototype.getUserData = function(req, res, next) {
	var timeout = req.param('timeout') || this.config.timeout || PGB_TIMEOUT;
	client.auth({
		token: req.token,
		proxy: this.config.proxyUrl
	}, function(err1, api) {
		if (err1) {
			setImmediate(next, err1);
		} else {
			log.http("BdPhoneGap#getUserData()", "GET /apps/me");
			api.get('/me', {
				timeout: timeout
			}, function(err2, userData) {
				if (err2) {
					setImmediate(next, err2);
				} else {
					log.info("BdPhoneGap#getUserData()", "userData:", userData);
					res.status(200).send({user: userData}).end();
				}
			});
		}
	});
};

BdPhoneGap.prototype.getAppStatus = function(req, res, next) {
	var timeout = req.param('timeout') || this.config.timeout || PGB_TIMEOUT;
	client.auth({
		token: req.token,
		proxy: this.config.proxyUrl
	}, function(err1, api) {
		if (err1) {
			setImmediate(next, err1);
		} else {
			var appId = req.params.appId;
			log.http("BdPhoneGap#getAppStatus()", "GET /apps/" + appId);					
			api.get('/apps/' + appId, {
				timeout: timeout
			}, function(err2, userData) {
				if (err2) {
					setImmediate(next, err2);
				} else {
					log.info("BdPhoneGap#getAppStatus()", "appStatus:", userData);
					res.status(200).send({user: userData}).end();
				}
			});	
		}
	});
};

/**
 * When a download request is received from "Build.js",
 * this function is called to do the following actions : 
 * - Create the appropriate file name
 * - Download the built project from Phonegap build using the 
 *   API-Phonegap-Build
 * - When the download is done, the file is piped to "Ares client"
 *   using a multipart/form Post request
 *   
 * @param  {Object}   req  Contain the request attributes
 * @param  {Object}   res  Contain the response attributes
 * @param  {Function} next a CommonJs callback
 * 
 */
BdPhoneGap.prototype.downloadApp = function(req, res, next){
	var timeout = req.param('timeout') || this.config.timeout || PGB_TIMEOUT;
	var appId = req.param("appId"),
	    platform = req.param("platform"),
	    title = req.param("title"),
	    version = req.param("version");
	log.info("BdPhoneGap#downloadApp()", "appId:", appId, "platform:", platform, "version:", version, "(" + title + ")");

	var extensions = {
		    "android": "apk",
		    "ios": "ipa",
		    "webos": "ipk",
		    "symbian": "wgz",
		    "winphone": "xap",
		    "blackberry": "jad"
	    };
	var fileName = title + "_" + version + "." + (extensions[platform] || "bin"),
	    url = "/apps/" + appId + "/" + platform;
	log.info("BdPhoneGap#downloadApp()", "packageName:", fileName, "<<< url:", url);
	
	/* FIXME: broken streams on node-0.8.x
	async.waterfall([
		client.auth.bind(client, {
			token: req.token,
			proxy: this.config.proxyUrl
		}),
		(function _pipeFormData(api, next) {
			log.http("BdPhoneGap#downloadApp#_pipeFormData()", "GET", url);
			var stream = api.get(url, { timeout: timeout });
			stream.pause();
			this.returnFormData([{
				name: fileName,
				stream: stream
			}], res, next);
		}).bind(this)
	], function(err) {
		if (err) {
			setImmediate(next, err);
			return;
		}
		log.verbose("BdPhoneGap#downloadApp()", "completed");
		// do not call next() here as the HTTP header was
		// already sent back.
	});
	 */

	var tempFileName = temp.path({prefix: 'com.enyojs.ares.services.' + this.config.basename + "." + platform + "."});
	async.waterfall([
		client.auth.bind(client, {
			token: req.token,
			proxy: this.config.proxyUrl
		}),
		function _fetchPackage(api, next) {
			log.http("BdPhoneGap#downloadApp#_fetchPackage()", "GET", url);
			var os = fs.createWriteStream(tempFileName);
			// FIXME: node-0.8 has no 'finish' event...
			os.on('close', next);
			api.get(url, { timeout: timeout*3 }).pipe(os);
		},
		// FIXME: broken streams on node-0.8.x: we need to
		// load packages in memory Buffer...
		fs.readFile.bind(fs, tempFileName),
		(function _returnFormData(buffer, next) {
			fs.unlink(tempFileName);
			log.http("BdPhoneGap#downloadApp#_returnFormData()", "streaming down:", fileName);
			this.returnFormData([{
				name: fileName,
				buffer: buffer
			}], res, next);
		}).bind(this)
	], function(err) {
		if (err) {
			setImmediate(next, err);
			return;
		}
		// FIXME: this is never called, as neither
		// CombinedStream nor express#res emit an 'end' when
		// streaming is over...
		log.verbose("BdPhoneGap#downloadApp()", "completed");
		// do not call next() here as the HTTP header was
		// already sent back.
	});
};

BdPhoneGap.prototype.build = function(req, res, next) {
	var appData = {}, query = req.query;
	log.info("BdPhoneGap#build()", "title:", query.title,"platforms:", query.platforms, ", appId:", query.appId);
	var timeout = req.param('timeout') || this.config.timeout || PGB_TIMEOUT;
	async.series([
		this.prepare.bind(this, req, res),
		this.store.bind(this, req, res),
		_parse.bind(this),
		this.minify.bind(this, req, res),
		_postMinify.bind(this, req),
		_addEnyoLoadErrorHandler.bind(this, req),
		this.zip.bind(this, req, res),
		_upload.bind(this),
		this.returnBody.bind(this, req, res),
		this.cleanSession.bind(this, req, res)
	], function (err) {
		if (err) {
			// run express's next() : the errorHandler (which calls cleanSession)
			setImmediate(next, err);
		}
		// we do not invoke error-less next() here
		// because that would try to return 200 with
		// an empty body, while we have already sent
		// back the response.
	});

	function _parse(next) {
		// check mandatory parameters
		if (!req.token) {
			setImmediate(next, new HttpError("Missing account token", 401));
			return;
		}
		if (!query.title) {
			setImmediate(next, new HttpError("Missing application: title", 400));
			return;
		}
		// pass other query parameters as 1st-level
		// property of the build request object.
		for (var p in query) {
			if (!appData[p] && (typeof p === 'string')) {
				try {
					appData[p] = JSON.parse(query[p]);
				} catch(e) {
					appData[p] = query[p];
				}
			}
		}
		if (typeof appData.keys !== 'object') {
			log.info("BdPhoneGap#build#_parse()", "un-signed build requested (did not find a valid signing key)");
		}
		//WARNING: enabling this trace shows-up the signing keys passwords
		log.silly("BdPhoneGap#build#_parse(): appData:", appData);
		setImmediate(next);
	}

	// ENYO-3561: adding a fake "debug.html" page to PGB app in case
	// of error during initialization
	// If this fails for whatever reason, we trace with a WARN and ignore the error as this is not 
	// a showstopper to build the app
	function _addEnyoLoadErrorHandler (req, next) {
		var dbg = path.join(req.appDir.zipRoot, "debug.html");
		var url = 'http://' + req.headers.host + '/ide/ares/error.html';
		request(url, function (error, res, body) {
			if (!error) {
				fs.writeFile (dbg, body, function(err) { 
					if (err) {
						log.warn("BdPhoneGap#build#_addEnyoLoadErrorHandler():fileWrite " + err + ' writing ' + dbg);
					}
					setImmediate(next); 
				});
			} else {
				log.warn("BdPhoneGap#build#_addEnyoLoadErrorHandler(): " + error + ' calling ' + url);
				setImmediate(next);
			}
		});
	}


	function _postMinify(req, next) {
		log.info("BdPhoneGap#build#_postMinify()");
		if (req.appDir.zipRoot !== req.appDir.source) {
			copyFile(path.join(req.appDir.source, "config.xml"), path.join(req.appDir.zipRoot, "config.xml"), next);
		} else {
			setImmediate(next);
		}
	}

	function _upload(next) {
		log.info("BdPhoneGap#build#_upload()");
		async.waterfall([
			client.auth.bind(this, {
				token: req.token,
				proxy: this.config.proxyUrl
			}),
			_uploadApp.bind(this),
			_success.bind(this)
		], function(err) {
			if (err) {
				_fail(err);
			} else {
				setImmediate(next);
			}
		});

		function _uploadApp(api, next) {
			var options = {
				form: {
					data: appData,
					file: req.zip.path
				},
				timeout: timeout*3
			};
			if (appData.appId) {
				log.http("BdPhoneGap#build#_upload#_uploadApp()", "PUT /apps/" + appData.appId + " (title='" + appData.title + "')");
				api.put('/apps/' + appData.appId, options, next);

			} else {
				log.http("BdPhoneGap#build#_upload#_uploadApp()", "POST /apps (title='" + appData.title + "')");
				options.form.data.create_method = 'file';
				api.post('/apps', options, next);
			}
		}

		function _success(data, next) {
			try {
				log.verbose("BdPhoneGap#build#_upload#_success()", "data", data);
				if (typeof data === 'string') {
					data = JSON.parse(data);
				}
				if (typeof data.error === 'string') {
					_fail(data.error);
					return;
				}
				res.body = data;
				setImmediate(next);
			} catch(e) {
				_fail(e);
			}
		}
		
		function _fail(err) {
			var msg;
			try {
				msg = JSON.parse(err.message).error;
			} catch(e) {
				msg = err.message;
			}
			log.warn("BdPhoneGap#build#_upload#_fail()", "error:", msg);
			setImmediate(next, new HttpError(msg, 400 /*Bad Request*/));
		}
	}
};

if (path.basename(process.argv[1], '.js') === basename) {
	// We are main.js: create & run the object...

	var knownOpts = {
		"port":		Number,
		"timeout":	Number,
		"pathname":	String,
		"level":	['silly', 'verbose', 'info', 'http', 'warn', 'error'],
		"help":		Boolean
	};
	var shortHands = {
		"p": "--port",
		"t": "--timeout",
		"P": "--pathname",
		"l": "--level",
		"v": "--level verbose",
		"h": "--help"
	};
	var helpString = [
		"Usage: node " + basename,
		"  -p, --port        port (o) local IP port of the express server (0: dynamic)                       [default: '0']",
		"  -t, --timeout     milliseconds of inactivity before a server socket is presumed to have timed out [default: '120000']",
		"  -P, --pathname    URL pathname prefix (before /minify and /build                                  [default: '/phonegap']",
		"  -l, --level       debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error')               [default: 'http']",
		"  -h, --help        This message"
	];
	var argv = require('nopt')(knownOpts, shortHands, process.argv, 2 /*drop 'node' & basename*/);
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
		timeout: argv.timeout,
		basename: basename,
		enyoDir: path.resolve(__dirname, '..', 'enyo'),
		level: argv.level
	}, function(err, service){
		if(err) {
			process.exit(err);
		}
		// process.send() is only available if the
		// parent-process is also node
		if (process.send) {
			process.send(service);
		}
	});

} else {

	// ... otherwise hook into commonJS module systems
	module.exports = BdPhoneGap;
}
