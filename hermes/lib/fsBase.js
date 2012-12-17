/**
 * Base toolkit for Hermes FileSystem providers implemented using Node.js
 */

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    http = require("http"),
    util  = require("util"),
    temp = require("temp"),
    HttpError = require("./httpError");

module.exports = FsBase;

function FsBase(inConfig, next) {

	for (var p in inConfig) {
		this[p] = inConfig[p];
	}

	if (this.verbose) {
		this.log = function() {
			console.log.bind(this, this.name).apply(this, arguments);
		};
	} else {
		this.log = function() {};
	}

	// parameters sanitization
	this.root = path.resolve(this.root);

	// sanity check
	[
		// middleware methods (always executed)
		'cors', 'authorize', 'respond',
		// admin methods
		'getUserInfo', 'setUserInfo',
		// filesystem verbs
		'propfind', 'get', 'put',
		'mkcol', 'delete', 'move', 'copy'
	].forEach((function(method) {
		if ((typeof(this[method]) !== 'function') ||
		    (this[method].length !== 3)) {
			next(new Error("BUG: method '" + method + "' is not a 3-parameters function"));
			return;
		}
	}).bind(this));

	if (express.version.match(/^2\./)) {
		// express-2.x
		this.app = express.createServer();
		this.server = this.app;
	} else {
		// express-3.x
		this.app = express();
		this.server = http.createServer(this.app); // XXX replace by HTTP server from config
	}

	// middleware that apply to any route

	this.app.use(express.logger('dev'));
	this.app.use(this.cors.bind(this));
	this.app.use(express.cookieParser());
	this.app.use(this.authorize.bind(this));

	// routes definition

	// URL-scheme: '/' to get/set user credentials
	this.route0 = makeExpressRoute.bind(this)('');
	
	// URL-scheme: ID-based file/folder tree navigation, used by
	// HermesClient.
	this.route1 = makeExpressRoute.bind(this)('/id/');
	var route2 = makeExpressRoute.bind(this)('/id/:id');

	// URL-scheme: WebDAV-like navigation, used by the Enyo loader
	// (itself used by the Enyo Javacript parser to analyze the
	// project source code) & by the Ares project preview.
	var route3 = makeExpressRoute.bind(this)('/file/*');

	// 2. Add route-dependent middleware

	// File-system verbs tunneling
	function makeVerb(req, res, next) {
		var verbs = {
			// verbs that are transmitted over an HTTP GET method
			GET: {
				PROPFIND: true,
				GET: true
			},
			// verbs that are transmitted over an HTTP POST method
			POST: {
				PUT: true,
				MKCOL: true,
				DELETE: true,
				MOVE: true,
				COPY: true
			}
		};
		req.originalMethod = req.method;
		if (req.query._method) {
			req.method = req.query._method.toUpperCase();
			delete req.query._method;
		}
		if (verbs[req.originalMethod] &&
		    verbs[req.originalMethod][req.method]) {
			next();
		} else {
			next(new HttpError("unknown originalMethod/method = "+req.originalMethod+"/"+req.method, 400));
		}
	}
	this.app.use(this.route1, makeVerb.bind(this));
	this.app.use(route2, makeVerb.bind(this));
	this.app.use(route3, makeVerb.bind(this));

	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.field[] & req.body.file[]
	var uploadDir = temp.path({prefix: 'com.palm.ares.services.fs.' + this.name}) + '.d';
	this.log("uploadDir:", uploadDir);
	fs.mkdirSync(uploadDir);
	this.app.use(express.bodyParser({keepExtensions: true, uploadDir: uploadDir}));

	/**
	 * Global error handler (last plumbed middleware)
	 * @private
	 */
	function errorHandler(err, req, res, next){
		console.error(err.stack);
		this.respond(res, err);
	}

	if (this.app.error) {
		// express-2.x: explicit error handler
		this.app.error(errorHandler.bind(this));
	} else {
		// express-3.x: middleware with arity === 4 is detected as the error handler
		this.app.use(errorHandler.bind(this));
	}

	// 3. Handle HTTP verbs

	function makeExpressRoute(path) {
		return (this.pathname + path)
			.replace(/\/+/g, "/") // compact "//" into "/"
			.replace(/(\.\.)+/g, ""); // remove ".."
	}

	this.log("GET/POST:", this.route0);
	this.app.get(this.route0, this.getUserInfo.bind(this));
	this.app.post(this.route0, this.setUserInfo.bind(this));

	this.log("ALL:", this.route1);
	this.app.all(this.route1, (function(req, res) {
		req.params.id = this.encodeFileId('/');
		receive.bind(this)(req, res, next);
	}).bind(this));

	this.log("ALL:", route2);
	this.app.all(route2, receive.bind(this));

	function receive(req, res, next) {
		this.log("req.query=" + util.inspect(req.query));
		req.params.id = req.params.id || this.encodeFileId('/');
		req.params.path = this.decodeFileId(req.params.id);
		this.log("req.params=" + util.inspect(req.params));
		this[req.method.toLowerCase()](req, res, this.respond.bind(this, res));
	}

	this.log("GET:", route3);
	this.app.get(route3, (function(req, res, next) {
		req.params.path = req.params[0];
		this.get(req, res, this.respond.bind(this, res));
	}).bind(this));
	
	// Send back the service location information (origin,
	// protocol, host, port, pathname) to the creator, when port
	// is bound
	this.server.listen(this.port, "127.0.0.1", null /*backlog*/, (function() {
		this.port = this.server.address().port;
		this.origin = "http://127.0.0.1:"+ this.port;
		return next(null, {
			protocol: 'http',
			host: '127.0.0.1',
			port: this.port,
			origin: this.origin,
			pathname: this.pathname
		});
	}).bind(this));

	/**
	 * Terminates express server
	 */
	this.quit = function() {
		this.server.close();
		this.log("exiting");
	};

}

// Middleware

// Authorize
FsBase.prototype.authorize = function(req, res, next) {
	this.log("FsBase.getUserInfo(): checking that request comes from 127.0.0.1");
	if (req.connection.remoteAddress !== "127.0.0.1") {
		next(new HttpError("Access denied from IP address "+req.connection.remoteAddress, 401 /*Unauthorized*/));
	} else {
		next();
	}
};

// CORS -- Cross-Origin Resources Sharing
FsBase.prototype.cors = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', "*"); // XXX be safer than '*'
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
	if ('OPTIONS' == req.method) {
		res.status(200).end();
	} else {
		next();
	}
};

// Utilities

FsBase.prototype.respond = function(res, err, response) {
	var statusCode, body;
	var statusCodes = {
		'ENOENT': 404, // Not-Found
		'EPERM' : 403, // Forbidden
		'EEXIST': 409  // Conflict
	};
	if (err) {
		if (err instanceof Error) {
			statusCode = err.statusCode || statusCodes[err.code] ||  403; // Forbidden
			delete err.statusCode;
			body = err;
		} else {
			statusCode = 500; // Internal Server Error
			body = new Error(err.toString());
		}
		this.log("<<<\n"+body.stack);
	} else if (response) {
		statusCode = response.code || 200 /*Ok*/;
		body = response.body;
	}
	if (body) {
		res.status(statusCode).send(body);
	} else if (statusCode) {
		res.status(statusCode).end();
	}
};

FsBase.prototype.encodeFileId = function(filePath) {
	// can use this.root, this.origin & this.pathname in addition
	// to filePath to encode the fileId
	var buf = new Buffer(filePath, 'utf-8');
	var fileId = buf.toString('hex');
	return fileId;
};

FsBase.prototype.decodeFileId = function(fileId) {
	// can use this.root, this.origin & this.pathname in addition
	// to fileId to decode the fileId
	var buf = new Buffer(fileId, 'hex');
	var filePath = buf.toString('utf-8');
	return filePath;
};

// Actions

FsBase.prototype.getUserInfo = function(req, res, next) {
	this.log("FsBase.getUserInfo(): req.query=", req.query);
	this.log("FsBase.getUserInfo(): req.params=", req.params);
	this.log("FsBase.getUserInfo(): req.cookies=", req.cookies);
	next(null, {
		code: 200 /*Ok*/,
		body: {}
	});
};

FsBase.prototype.setUserInfo = function(req, res, next) {
	this.log("FsBase.setUserInfo(): req.query=", req.query);
	this.log("FsBase.setUserInfo(): req.params=", req.params);
	this.log("FsBase.setUserInfo(): req.cookies=", req.cookies);
	next(null, {
		code: 200 /*Ok*/,
		body: {}
	});
};

