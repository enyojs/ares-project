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
    async = require("async"),
    mkdirp = require("mkdirp"),
    rimraf = require("rimraf"),
    http = require("http"),
    client = require("phonegap-build-api"),
    BdBase = require("./lib/bdBase"),
    HttpError = require("./lib/httpError");

var basename = path.basename(__filename, '.js'),
    log = npmlog;
log.heading = basename;
log.level = 'http';

var url = 'build.phonegap.com';

process.on('uncaughtException', function (err) {
	log.error('uncaughtException', err.stack);
	process.exit(1);
});

function BdPhoneGap(config, next) {
	config.pathname = config.pathname || '/phonegap';

	config.minifyScript = config.minifyScript || path.join(config.enyoDir, 'tools', 'deploy.js');
	try {
		var stat = fs.statSync(config.minifyScript);
		if (!stat.isFile()) throw "Not a file";
	} catch(e) {
		// Build a more usable exception
		next(new Error("Not a suitable Enyo: it does not contain a usable 'tools/deploy.js'"));
	}

	BdBase.call(this, config, next);
	log.verbose('BdPhoneGap', "config:",  this.config);
}
util.inherits(BdPhoneGap, BdBase);

BdPhoneGap.prototype.use = function() {
	log.verbose('BdPhoneGap#use()', "configuring..."); 
	this.app.use(express.cookieParser());
	this.app.use(this.makeExpressRoute('/op'), authorize.bind(this));
	this.app.use(this.makeExpressRoute('/api'), authorize.bind(this));
	

	function authorize(req, res, next) {
		log.verbose("authorize()", "req.url:", req.url);
		log.verbose("authorize()", "req.query:", req.query);
		log.verbose("authorize()", "req.cookies:", req.cookies);
		var token = req.cookies.token || req.param('token');
		if (token) {
			req.token = token;
			next();
		} else {
			next(new HttpError('Missing authentication token', 401));
		}
	}
};

BdPhoneGap.prototype.route = function() {
	log.verbose('BdPhoneGap#route()', "configuring..."); 
	// '/token' & '/api' -- Wrapped public Phonegap API
	this.app.post(this.makeExpressRoute('/token'), this.getToken.bind(this));
	this.app.get(this.makeExpressRoute('/api/v1/me'), this.getUserData.bind(this));
	this.app.get(this.makeExpressRoute('/api/v1/apps/:applicationID'), this.getAppStatus.bind(this));
	this.app.get(this.makeExpressRoute('/api/v1/apps/:appID/:pf/'),
				 this.downloadApp.bind(this));
};
	
BdPhoneGap.prototype.errorHandler = function(err, req, res, next){
	var self = this;
	log.info("errorHandler()", "err:", err);
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
			self.setCookie(res, 'token', null);
		}
		res.contentType('txt'); // direct usage of 'text/plain' does not work
		res.send(err.toString());
	}
};

BdPhoneGap.prototype.getToken = function(req, res, next) {
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
			if (err1 || response.statusCode != 200) {
				var msg = (err1 && err1.toString()) || http.STATUS_CODES[response.statusCode] || "Error";
				log.warn("getToken()", msg);
				next(new HttpError(msg, response.statusCode));
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
};

BdPhoneGap.prototype.getUserData = function(req, res, next) {
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
};
BdPhoneGap.prototype.getAppStatus = function(req, res, next) {
	client.auth({
		token: req.token,
		proxy: this.config.proxyUrl
	}, function(err1, api) {
		if (err1) {
			next(err1);
		} else {
			var appID = req.params.applicationID;
					
			api.get('/apps/' + appID, function(err2, userData) {
				if (err2) {
					next(err2);
				} else {
					log.info("getAppStatus()", "appStatus:", userData);
					res.status(200).send({user: userData}).end();
			 	}
			});	
		}
	});
};

BdBase.prototype.build = function(req, res, next) {
	var appData = {}, query = req.query;
	log.info("build()", "title:", query.title, ", platforms:", query.platforms, ", appId:", query.appId);
	async.series([
		this.prepare.bind(this, req, res),
		this.store.bind(this, req, res),
		_parse.bind(this),
		this.minify.bind(this, req, res),
		this.zip.bind(this, req, res),
		_upload.bind(this),
		this.returnBody.bind(this, req, res),
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

	function _parse(next) {
		var errs = [];
		// check mandatory parameters
		if (!req.token) {
			next(new HttpError("Missing account token", 401));
			return;
		}
		if (!query.title) {
			next(new HttpError("Missing application: title", 400));
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
			log.info("build#_parse()", "un-signed build requested (did not find a valid signing key)");
		}
		//WARNING: enabling this trace shows-up the signing keys passwords
		log.silly("build#_parse(): appData:", appData);
		next();
	};




	BdPhoneGap.prototype.downloadApp = function(req, res, next){

		client.auth({
		token: req.token,
		proxy: this.config.proxyUrl
	}, function(err1, api) {
		if (err1) {
			next(err1);
		} else {
			var appID = req.params.applicationID;
			var platform = req.params.pf
						
			api.get('/apps/' + appID, function(err2, userData) {
				if (err2) {
					next(err2);
				} else {
					log.info("downladApp()", "downlading:", userData);
					switch(platform){
						case "android": {
							api.get('/apps/' +appID +'/android', 
							function(err2, userData) {
								if (err2) {
									next(err2);
								} else {
									log.info("getAppStatus()", "appStatus:", userData);
									res.status(200).send({user: userData}).end();
							 	}
							}).pipe(fs.createWriteStream('app.apk'));

							default: log.info("Another platform");


						}
					
				}
			});
		}
	});

	};

	function _upload(next) {
		log.info("build#_upload()");

		async.waterfall([
			client.auth.bind(this, {
				token: req.token,
				proxy: this.config.proxyUrl
			}),
			_uploadApp.bind(this),
			_success.bind(this)
		], function(err, result) {
			if (err) {
				_fail(err);
			} else {
				next();
			}
		});

		function _uploadApp(api, next) {
			var options = {
				form: {
					data: appData,
					file: req.zip.path
				}
			};
			if (appData.appId) {
				log.http("build#_upload#_uploadApp()", "PUT /apps/" + appData.appId + " (title='" + appData.title + "')");
				api.put('/apps/' + appData.appId, options, next);

			} else {
				log.http("build#_upload#_uploadApp()", "POST /apps (title='" + appData.title + "')");
				options.form.data.create_method = 'file';
				api.post('/apps', options, next);
			}
		}

		function _success(data, next) {
			try {
				log.verbose("build#_upload#_success()", "data", data);
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
			var msg;
			try {
				msg = JSON.parse(err.message).error;
			} catch(e) {
				msg = err.message;
			}
			log.warn("build#_upload#_fail()", "error:", msg);
			next(new HttpError(msg, 400 /*Bad Request*/));
		}
	}
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
		"  -P, --pathname    URL pathname prefix (before /minify and /build                    [default: '/phonegap']",
		"  -l, --level       debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error') [default: 'http']",
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
		basename: basename,
		level: log.level,
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
