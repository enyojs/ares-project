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

	this.log = function() {
		if (this.verbose) {
			console.log.bind(this, this.name).apply(this, arguments);
		}
	};

	for (var p in inConfig) {
		this[p] = inConfig[p];
		this.log("config: ", p, "=", inConfig[p]);
	}

	// parameters sanitization
	this.root = path.resolve(this.root);
	this.verbose = (this.verbose !== undefined) || (this.verbose !== null);

	// sanity check
	[
		// admin methods
		'cors', 'auth', 'respond',
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

	this.app.use(express.logger('dev'));
	this.app.use(this.cors);
	this.app.use(express.cookieParser());
	this.app.use(this.auth);

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

	// HTTP method tunneling
	this.app.use(function(req, res, next) {
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
	});

	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.field[] & req.body.file[]
	var uploadDir = temp.path({prefix: 'com.palm.ares.services.fs.' + this.name}) + '.d';
	this.log("uploadDir:", uploadDir);
	fs.mkdirSync(uploadDir);
	this.app.use(express.bodyParser({keepExtensions: true, uploadDir: uploadDir}));

	/**
	 * Global error handler
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

	function makeExpressRoute(path) {
		return (this.pathname + path)
			.replace(/\/+/g, "/") // compact "//" into "/"
			.replace(/(\.\.)+/g, ""); // remove ".."
	}

	// URL-scheme: ID-based file/folder tree navigation, used by
	// HermesClient.
	this.route1 = makeExpressRoute.bind(this)('/id/');
	this.log("ALL:", this.route1);
	this.app.all(this.route1, (function(req, res) {
		req.params.id = this.encodeFileId('/');
		receive.bind(this)(req, res, next);
	}).bind(this));

	var route2 = makeExpressRoute.bind(this)('/id/:id');
	this.log("ALL:", route2);
	this.app.all(route2, receive.bind(this));

	function receive(req, res, next) {
		this.log("req.query=" + util.inspect(req.query));
		req.params.id = req.params.id || this.encodeFileId('/');
		req.params.path = this.decodeFileId(req.params.id);
		this.log("req.params=" + util.inspect(req.params));
		this[req.method.toLowerCase()](req, res, this.respond.bind(this, res));
	}

	// URL-scheme: WebDAV-like navigation, used by the Enyo loader
	// (itself used by the Enyo Javacript parser to analyze the
	// project source code) & by the Ares project preview.
	var route3 = makeExpressRoute.bind(this)('/file/*');
	this.log("GET:", route3);
	this.app.get(route3, (function(req, res, next) {
		req.params.path = req.params[0];
		this.get(req, res, this.respond.bind(this, res));
	}).bind(this));
	
	// Send back the URL (origin + pathname) to the creator, when
	// port is bound
	this.server.listen(this.port, "127.0.0.1", null /*backlog*/, (function() {
		this.origin = "http://127.0.0.1:"+this.server.address().port.toString();
		return next(null, {
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

FsBase.prototype.auth = function(req, res, next) {
	if (req.connection.remoteAddress !== "127.0.0.1") {
		next(new Error("Access denied from IP address "+req.connection.remoteAddress));
	} else {
		next();
	}
};

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
	var fileId = encodeURIComponent(filePath);
	return fileId;
};

FsBase.prototype.decodeFileId = function(fileId) {
	// can use this.root, this.origin & this.pathname in addition
	// to fileId to decode the fileId
	var filePath = decodeURIComponent(fileId);
	return filePath;
};
