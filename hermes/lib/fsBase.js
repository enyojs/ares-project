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

	this.log = function() {
		if (this.verbose) {
			console.log.bind(this, this.name).apply(this, arguments);
		}
	};

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
		this.server = http.createServer(this.app);
	}

	this.app.configure((function() {
		if (!this.quiet) {
			this.app.use(express.logger('dev'));
		}
		this.app.use(this.cors.bind(this));
		this.app.use(express.cookieParser());
		this.app.use(this.authorize.bind(this));
		this.app.use(express.methodOverride());
		
		this.app.use(this.dump.bind(this));
	
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
	}).bind(this));

	// 3. Handle HTTP verbs
	
	function makeExpressRoute(path) {
		return (this.pathname + path)
			.replace(/\/+/g, "/") // compact "//" into "/"
			.replace(/(\.\.)+/g, ""); // remove ".."
	}
	
	// URL-scheme: '/' to get/set user credentials
	this.route0 = makeExpressRoute.bind(this)('');
	
	this.log("GET/POST:", this.route0);
	this.app.get(this.route0, this.getUserInfo.bind(this));
	this.app.post(this.route0, this.setUserInfo.bind(this));

	// URL-scheme: ID-based file/folder tree navigation, used by
	// HermesClient.
	this.route1 = makeExpressRoute.bind(this)('/id/');
	this.route2 = makeExpressRoute.bind(this)('/id/:id');

	this.log("ALL:", this.route1);
	this.app.all(this.route1, (function(req, res) {
		req.params.id = this.encodeFileId('/');
		receiveId.bind(this)(req, res, next);
	}).bind(this));

	this.log("ALL:", this.route2);
	this.app.all(this.route2, receiveId.bind(this));

	function receiveId(req, res, next) {
		var method = req.method.toLowerCase();
		req.params.id = req.params.id || this.encodeFileId('/');
		req.params.path = this.decodeFileId(req.params.id);
		this.log("FsBase.receiveId(): method:" + method + ", req.params:", req.params);
		this[method](req, res, this.respond.bind(this, res));
	}

	// URL-scheme: WebDAV-like navigation, used by the Enyo loader
	// (itself used by the Enyo Javacript parser to analyze the
	// project source code) & by the Ares project preview.
	this.route3 = makeExpressRoute.bind(this)('/file/*');

	this.log("ALL:", this.route3);
	this.app.all(this.route3, receivePath.bind(this));

	function receivePath(req, res, next) {
		var method = req.method.toLowerCase();
		req.params.path = req.params[0];
		req.params.id = this.encodeFileId(req.params.path);
		this.log("FsBase.receivePath(): method:" + method + ", req.params:", req.params);
		this[method](req, res, this.respond.bind(this, res));
	}

	//this.log("routes:", this.app.routes);

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
	this.quit = function(next) {
		this.log("exiting");
		this.server.close(next);
	};

}

// Middleware

// Authorize
FsBase.prototype.authorize = function(req, res, next) {
	this.log("FsBase.authorize(): checking that request comes from 127.0.0.1");
	if (req.connection.remoteAddress !== "127.0.0.1") {
		next(new HttpError("Access denied from IP address "+req.connection.remoteAddress, 401 /*Unauthorized*/));
	} else {
		this.log("FsBase.authorize(): Ok");
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

/**
 * Turns an {Error} object into a usable response {Object}
 * 
 * A response {Object} as #code and #body properties.  This method is
 * expecyted to be overriden by sub-classes of {FsBase}.
 * 
 * @param {Error} err the error object to convert.
 */
FsBase.prototype.errorResponse = function(err) {
	this.log("FsBase.errorResponse(): err:", err);
	var response = {
		code: 403,	// Forbidden
		body: err.toString()
	};
	if (err instanceof Error) {
		response.code = err.statusCode || 403 /*Forbidden*/;
		response.body = err.toString();
		this.log(err.stack);
	}
	this.log("FsBase.errorResponse(): response:", response);
	return response;
};

/**
 * Unified response handler
 * @param {Object} res the express response {Object}
 * @param {Object} err the error if any.  Can be any kind of {Error}, such as an { HttpError}
 * @param {Object} response is an {Object} that has 2 properties: #code (used as the HTTP statusCode) and #body (inlined in the response body, of not falsy)
 */
FsBase.prototype.respond = function(res, err, response) {
	this.log("FsBase.respond(): response:", response);
	if (err) {
		response = this.errorResponse(err);
	}
	if (response && response.body) {
		res.status(response.code).send(response.body);
	} else if (response && response.code) {
		res.status(response.code).end();
	}
};

FsBase.prototype.encodeFileId = function(filePath) {
	//this.log("encodeFileId(): filePath:", filePath);
	// can use this.root, this.origin & this.pathname in addition
	// to filePath to encode the fileId
	var buf = new Buffer(filePath, 'utf-8');
	var fileId = buf.toString('hex');
	return fileId;
};

FsBase.prototype.decodeFileId = function(fileId) {
	//this.log("decodeFileId(): fileId:", fileId);
	// can use this.root, this.origin & this.pathname in addition
	// to fileId to decode the fileId
	var buf = new Buffer(fileId, 'hex');
	var filePath = buf.toString('utf-8');
	return filePath;
};

// Actions

FsBase.prototype.dump = function(req, res, next) {
	//this.log("FsBase.dump(): req.keys=", Object.keys(req));
	this.log("FsBase.dump(): req.method=", req.method);
	this.log("FsBase.dump(): req.url=", req.url);
	this.log("FsBase.dump(): req.query=", req.query);
	this.log("FsBase.dump(): req.cookies=", req.cookies);
	this.log("FsBase.dump(): req.body=", req.body);
	next();
};

FsBase.prototype.getUserInfo = function(req, res, next) {
	this.log("FsBase.getUserInfo():");
	next(null, {
		code: 200 /*Ok*/,
		body: {}
	});
};

FsBase.prototype.setUserInfo = function(req, res, next) {
	this.log("FsBase.setUserInfo():");
	next(null, {
		code: 200 /*Ok*/,
		body: {}
	});
};

