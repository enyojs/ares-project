/* global require, console, module, Buffer, process  */
/**
 * Base toolkit for Hermes FileSystem providers implemented using Node.js
 */

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    http = require("http"),
    tunnel = require("tunnel"),
    createDomain = require('domain').create,
    temp = require("temp"),
    async = require("async"),
    HttpError = require("./httpError");

module.exports = FsBase;

function FsBase(inConfig, next) {

	for (var p in inConfig) {
		this[p] = inConfig[p];
	}

	if (this.level === 'verbose' || this.level === 'silly') {
		this.log = function() {
			console.log.bind(this, this.name).apply(this, arguments);
		};
	} else {
		this.log = function(){};
	}

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

	// express-3.x
	this.app = express();
	this.server = http.createServer(this.app);

	this.app.configure((function() {
		this.app.use(this.separator.bind(this));
		if (this.level !== 'error') {
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

		this.app.use(this.cors.bind(this));
		this.app.use(express.cookieParser());
		this.app.use(this.pathname, this.authorize.bind(this));
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
		
		// express-3.x: middleware with arity === 4 is
		// detected as the error handler
		this.app.use(errorHandler.bind(this));
	}).bind(this));

	// outbound http/https traffic

	this.httpAgent = null;
	this.httpsAgent = null;

	// 2. Dynamic configuration
	
	this.app.post('/config', (function(req, res, next) {
		this.log("req.body:", req.body);
		var config = req.body && req.body.config;
		this.configure(config, function(err) {
			res.status(200).end();
		});
	}).bind(this));

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

	// 3. Handle HTTP verbs
	
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
		var tcpAddr = this.server.address();
		this.host = tcpAddr.address;
		this.port = tcpAddr.port;
		this.origin = "http://" + this.host + ":"+ this.port;
		return next(null, {
			protocol: 'http',
			host: this.host,
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

// Configure -- one per fs instance

FsBase.prototype.configure = function(config, next) {
	this.log("FsBase.configure(): config:", config);
	if (next) {
		next();
	}
};

// Middlewares -- one per session

FsBase.prototype.separator = function(req, res, next) {
	this.log("---------------------------------------------------------");
	next();
};

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
 * Normalize a path using only `/`, to make it usable in URL's
 * @param {String} p the path to normalize
 */
if (process.platform === 'win32') {
	FsBase.prototype.normalize = function(p) {
		return path.normalize(p).replace(/\\/g,'/');
	};
} else {
	FsBase.prototype.normalize = function(p) {
		return path.normalize(p);
	};
}

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
 * @param {Object} response is a response {Object}
 * 
 * A response {Object} has:
 * 
 * - Two mandatory properties: #code (used as the HTTP statusCode) and
 * #body (inlined in the response body, of not falsy).
 * - One optional #headers property is an {Object} of HTTP headers to
 * be carried into the response message
 */
FsBase.prototype.respond = function(res, err, response) {
	this.log("FsBase.respond(): response:", response);
	if (err) {
		response = this.errorResponse(err);
	}
	if (response && response.headers) {
		for (var h in Object.keys(response.headers)) {
			res.setHeader(h, response.headers);
		}
	}
	if (response && response.body) {
		res.status(response.code).send(response.body);
	} else if (response) {
		res.status(response.code).end();
	} else {
		this.log("FsBase.respond: response sent or being being sent");
	}
};

FsBase.prototype.encodeFileId = function(filePath) {
	//this.log("encodeFileId(): filePath:", filePath);
	var buf = new Buffer(filePath, 'utf-8');
	var fileId = buf.toString('hex');
	return fileId;
};

FsBase.prototype.decodeFileId = function(fileId) {
	//this.log("decodeFileId(): fileId:", fileId);
	var buf = new Buffer(fileId, 'hex');
	var filePath = buf.toString('utf-8');
	return filePath;
};

FsBase.prototype.parseProxy = function(config) {
	var self = this;
	
	this.httpAgent = _makeAgent('http', config);
	this.httpsAgent = _makeAgent('https', config);
	
	function _makeAgent(protocol, config) {
		var proxyConfig = config.proxy && config.proxy[protocol];
		if (!proxyConfig) {
			return undefined;
		}
		var tunnelConstructor = tunnel[protocol + proxyConfig.tunnel];
		var agent;
		if (proxyConfig && typeof tunnelConstructor == 'function') {
			agent = tunnelConstructor({proxy: proxyConfig});
			self.log("FsBase.parseProxy(): protocol:", protocol, "agent:", agent);
		} else {
			console.warning("FsBase.parseProxy(): protocol:", protocol, "invalid proxy configuration:", config.proxy, "will use default agent");
		}
		return agent;
	}
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

FsBase.prototype.put = function(req, res, next) {
	this.log("FsBase.put(): req.headers", req.headers);
	this.log("FsBase.put(): req.body", req.body);

	if (req.is('application/x-www-form-urlencoded')) {
		// carry a single file at most
		return this._putWebForm(req, res, next);
	} else if (req.is('multipart/form-data')) {
		// can carry several files
		return this._putMultipart(req, res, next);
	} else {
		next(new Error("Unhandled upload of content-type='" + req.headers['content-type'] + "'"));
	}
};

/**
 * Store a file provided by a web-form
 * 
 * The web form is a 'application/x-www-form-urlencoded'
 * request, which contains the following fields:
 * 
 * - name (optional) is the name of the file to be created or
 *   updated.
 * - path (mandatory) is the relative path to the storage root
 *   of the file to be uploaded (if name is absent) or to the
 *   containing folder (if name is provided).
 * - content (mandatory) is the base64-encoded version of the
 *   file
 * 
 * @param {HTTPRequest} req 
 * @param {HTTPResponse} res
 * @param {Function} next(err, data) CommonJS callback 
 */
FsBase.prototype._putWebForm = function(req, res, next) {
	// Mutually-agreed encoding of file name & location:
	// 'path' and 'name'
	var relPath, fileId,
	    pathParam = req.param('path'),
	    nameParam = req.param('name');
	this.log("FsBase.putWebForm(): pathParam:", pathParam, "nameParam:", nameParam);
	if (!pathParam) {
		next(new HttpError("Missing 'path' request parameter", 400 /*Bad Request*/));
		return;
	}
	if (nameParam === '.'|| !nameParam) {
		relPath = pathParam;
	} else {
		relPath = [pathParam, nameParam].join('/');
	}

	// Now get the bits: base64-encoded binary in the
	// 'content' field
	var buf;
	if (req.body.content) {
		buf = new Buffer(req.body.content, 'base64');
	} else {
		this.log("FsBase.putWebForm(): empty file");
		buf = new Buffer('');
	}
	
	var urlPath = this.normalize(relPath);
	this.log("FsBase.putWebForm(): storing file as", urlPath);
	fileId = this.encodeFileId(urlPath);
	this.putFile(req, {
		name: relPath,
		buffer: buf
	}, (function(err){
		this.log("FsBase.putWebForm(): err:", err);
		next(err, {
			code: 201, // Created
			body: [{
				id: fileId,
				path: urlPath,
				name: path.basename(urlPath),
				isDir: false
			}]
		});
	}).bind(this));
};

/**
 * Stores one or more files provided by a multipart form
 * 
 * The multipart form is a 'multipart/form-data'.  Each of its
 * parts follows this field convention, compatible with the
 * Express/Connect bodyParser, itself based on the Formidable
 * Node.js module.
 * 
 * @param {HTTPRequest} req 
 * @param {HTTPResponse} res
 * @param {Function} next(err, data) CommonJS callback 
 */
FsBase.prototype._putMultipart = function(req, res, next) {
	var pathParam = req.param('path');
	this.log("FsBase.putMultipart(): req.files:", req.files);
	this.log("FsBase.putMultipart(): req.body:", req.body);
	this.log("FsBase.putMultipart(): pathParam:", pathParam);
	if (!req.files.file) {
		next(new HttpError("No file found in the multipart request", 400 /*Bad Request*/));
		return;
	}
	var files = [];
	if (Array.isArray(req.files.file)) {
		files.push.apply(files, req.files.file);
	} else {
		files.push(req.files.file);
	}

	// work-around firefox bug, that does not incorporate filename
	// as third parameter of FormData#append().  We then expect a
	// handful of filename=xxx keyvals, that will complement the
	// file fields of the FormData.
	var filenames = [];
	if (req.body.filename) {
		if (Array.isArray(req.body.filename)) {
			filenames.push.apply(filenames, req.body.filename);
		} else {
			filenames.push(req.body.filename);
		}
		for (var i = 0; i < files.length; i++) {
			if (filenames[i]) {
				files[i].name = filenames[i];
			}
		}
	}

	this.log("FsBase.putMultipart(): files", files);

	var nodes = [];
	async.forEachSeries(files, (function(file, cb) {

		if (file.name === '.' || !file.name) {
			file.name = pathParam;
		} else {
			file.name = [pathParam, file.name].join('/');
		}

		var putCallback = function(err, node) {
			this.log("FsBase.putMultipart(): err:", err, "node:", node);
			if (err) {
				cb(err);
			} else if (node) {
				nodes.push(node);
			}
			cb();
		};

		if (file.type.match(/x-encoding=base64/)) {
			fs.readFile(file.path, function(err, data) {
				if (err) {
					console.log("transcoding: error" + file.path, err);
					cb(err);
					return;
				}
				try {
					var fpath = file.path;
					delete file.path;
					fs.unlink(fpath, function(err) { /* Nothing to do */ });
					file.buffer = new Buffer(data.toString('ascii'), 'base64');			// TODO: This works but I don't like it

					this.putFile(req, file, putCallback.bind(this));
				} catch(transcodeError) {
					console.log("transcoding error: " + file.path, transcodeError);
					cb(transcodeError);
				}
			}.bind(this));
		} else {
			this.putFile(req, file, putCallback.bind(this));
		}
	}).bind(this), (function(err){
		this.log("FsBase.putMultipart(): nodes:", nodes);
		next(err, {
			code: 201, // Created
			body: nodes
		});
	}).bind(this));
};

/**
 * Write a file in the filesystem
 * 
 * Invokes the CommonJs callback with the created {ares.Filesystem.Node}.
 * 
 * @param {Object} req the express request context
 * @param {Object} file contains mandatory #name property, plus either
 * #buffer (a {Buffer}) or #path (a temporary absolute location).
 * @param {Function} next a Common-JS callback
 */
FsBase.prototype.putFile = function(req, file, next) {
	next (new HttpError("ENOSYS", 500));
};

