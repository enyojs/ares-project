/* jshint node:true */
/**
 * Base toolkit for Hermes FileSystem providers implemented using Node.js
 */

var fs = require("graceful-fs"),
    path = require("path"),
    util = require("util"),
    express = require("express"),
    tunnel = require("tunnel"),
    log = require('npmlog'),
    HttpError = require("./httpError"),
    ServiceBase = require("./svcBase");

module.exports = FsBase;

/**
 * Base object for Ares file-system services
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
function FsBase(config, next) {
	ServiceBase.call(this, config, next);

	// sanity check
	[
		// middleware methods (always executed)
		'allowLocalOnly', 'respond',
		// admin methods
		'getUserInfo', 'setUserInfo',
		// filesystem verbs
		'propfind', 'get', 'put',
		'mkcol', 'delete', 'move', 'copy'
	].forEach((function(method) {
		if ((typeof(this[method]) !== 'function') ||
		    (this[method].length !== 3)) {
			setImmediate(next, new Error("BUG: method '" + method + "' is not a 3-parameters function"));
			return;
		}
	}).bind(this));
}

util.inherits(FsBase, ServiceBase);

/**
 * Additionnal middlewares: 'this.app.use(xxx)'
 * @protected
 */
FsBase.prototype.use = function() {
	log.verbose('FsBase#use()'); 
	this.app.use(express.cookieParser());
	this.app.use(this.config.pathname, this.authorize.bind(this));
	this.app.use(express.methodOverride());
	this.app.use(this.dump.bind(this));
};

FsBase.prototype.cleanProcess = function(next) {
	log.verbose('FsBase#cleanProcess()');
	setImmediate(next);
};

/**
 * Additionnal routes/verbs: 'this.app.get()', 'this.app.port()'
 * @protected
 */
FsBase.prototype.route = function() {
	log.verbose('FsBase#route()'); 
	// URL-scheme: '/' to get/set user credentials
	this.route0 = this.makeExpressRoute.bind(this)('');

	log.verbose("FsBase#route()", "GET/POST:", this.route0);
	this.app.get(this.route0, this.getUserInfo.bind(this));
	this.app.post(this.route0, this.setUserInfo.bind(this));

	// 3. Handle HTTP verbs

	// URL-scheme: ID-based file/folder tree navigation, used by
	// HermesClient.
	this.route1 = this.makeExpressRoute.bind(this)('/id/');
	this.route2 = this.makeExpressRoute.bind(this)('/id/:id');

	log.verbose("FsBase#route()", "ALL:", this.route1);
	this.app.all(this.route1, (function(req, res, next) {
		req.params.id = this.encodeFileId('/');
		req.params.path = '/';
		_handle.bind(this)(req, res, next);
	}).bind(this));

	log.verbose("FsBase#route()", "ALL:", this.route2);
	this.app.all(this.route2, [_parseIdUrl.bind(this)], _handle.bind(this));

	function _parseIdUrl(req, res, next) {
		log.silly("FsBase#_parseIdUrl()", "parsing file id:", req.params.id);
		req.params.id = req.params.id || this.encodeFileId('/');
		req.params.path = this.decodeFileId(req.params.id);
		setImmediate(next);
	}

	// URL-scheme: WebDAV-like navigation, used by the Enyo loader
	// (itself used by the Enyo Javacript parser to analyze the
	// project source code) & by the Ares project preview.

	function _parseFileUrl(req, res, next) {
		log.silly("FsBase#_parseFileUrl()", "parsing file path:", req.params[0]);
		req.params.path = req.params[0];
		req.params.id = this.encodeFileId(req.params.path);
		setImmediate(next);
	}

	var overlays = {
		// "source/enyo-editor/deimos/designer/designerFrame/*"
		// FIXME: should be somehow automatic
		designer: path.join(__dirname, "..", "..", "source", "enyo-editor", "deimos", "designer", "designerFrame"),
		// "node_modules/less/dist/*"
		less: path.join(__dirname, "..", "..", "node_modules", "less", "dist")
	};
	function _parseOverlays(req, res, next) {
		var overlayDir = overlays[req.query.overlay];
		if (overlayDir) {
			log.silly("FsBase#_parseOverlays()", "checking for overlay='" + req.query.overlay + "' files...");
			// We cannot use express.static(), because it would serve
			// designer files always from the same mount-point in
			// the '/file' tree.
			var filePath = path.join(overlayDir, path.basename(req.params.path));
			fs.stat(filePath, (function(err, stats) {
				if (err) {
					next(err);
				} else if (stats.isFile()) {
					log.silly("FsBase#_parseOverlays()", "found overlay file:", filePath);
					res.status(200);
					res.sendfile(filePath);
				} else {
					next();
				}
			}).bind(this));
		} else {
			setImmediate(next);
		}
	}
	
	this.route3 = this.makeExpressRoute.bind(this)('/file/*');
	log.verbose("FsBase#route()", "ALL:", this.route3);
	this.app.all(this.route3, [_parseFileUrl.bind(this), _parseOverlays.bind(this)], _handle.bind(this));

	function _handle(req, res, next) {
		var method = req.method.toLowerCase();
		log.verbose("FsBase#_handle()", "method:", method, "req.params.id:", req.params.id, "req.params.path:", req.params.path);
		this[method](req, res, this.respond.bind(this, res));
	}

	log.verbose("FsBase#route()", "app.routes:", this.app.routes);
};

/**
 * Global error handler (arity === 4)
 * @protected
 */
FsBase.prototype.errorHandler = function(err, req, res, next){
	log.error("FsBase#errorHandler", err.stack);
	this.respond(res, err);
};

// Middlewares -- one per session

// Authorize
FsBase.prototype.authorize = function(req, res, next) {
	log.verbose("FsBase#authorize()", "checking that request comes from 127.0.0.1");
	if (req.connection.remoteAddress !== "127.0.0.1") {
		setImmediate(next, new HttpError("Access denied from IP address "+req.connection.remoteAddress, 401 /*Unauthorized*/));
	} else {
		log.verbose("FsBase#authorize()", "Ok");
		setImmediate(next);
	}
};

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
	log.warn("FsBase#errorResponse()", "err:", err);
	var response = {
		code: 403,	// Forbidden
		body: err.toString()
	};
	if (err instanceof Error) {
		response.code = err.statusCode || 403 /*Forbidden*/;
		response.body = err.toString();
		log.warn("FsBase#errorResponse()", err.stack);
	}
	log.info("FsBase#errorResponse()", "response:", response);
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
	log.verbose("FsBase#respond()", "response:", response);
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
		log.silly("FsBase#respond()", "response already sent or being streamed");
	}
};

FsBase.prototype.encodeFileId = function(filePath) {
	log.silly("FsBase#encodeFileId()", "filePath:", filePath);
	var buf = new Buffer(filePath, 'utf-8');
	var fileId = buf.toString('hex');
	return fileId;
};

FsBase.prototype.decodeFileId = function(fileId) {
	log.silly("FsBase#encodeFileId()", "fileId:", fileId);
	var buf = new Buffer(fileId, 'hex');
	var filePath = buf.toString('utf-8');
	return filePath;
};

FsBase.prototype.parseProxy = function(config) {
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
			log.info("FsBase.parseProxy()", "protocol:", protocol, "agent:", agent);
		} else {
			log.warn("FsBase#parseProxy()", "protocol:", protocol, "invalid proxy configuration:", config.proxy, "will use default agent");
		}
		return agent;
	}
};

// Actions

FsBase.prototype.dump = function(req, res, next) {
	//log.silly("FsBase.dump()", "req.keys=", Object.keys(req));
	log.silly("FsBase#dump()", "req.method=", req.method);
	log.silly("FsBase#dump()", "req.headers=", req.headers);
	log.silly("FsBase#dump()", "req.url=", req.url);
	log.silly("FsBase#dump()", "req.query=", req.query);
	log.silly("FsBase#dump()", "req.cookies=", req.cookies);
	log.silly("FsBase#dump()", "req.body=", req.body);
	setImmediate(next);
};

FsBase.prototype.getUserInfo = function(req, res, next) {
	log.verbose("FsBase#getUserInfo():");
	setImmediate(next, null, {
		code: 200 /*Ok*/,
		body: {}
	});
};

FsBase.prototype.setUserInfo = function(req, res, next) {
	log.verbose("FsBase#setUserInfo():");
	setImmediate(next, null, {
		code: 200 /*Ok*/,
		body: {}
	});
};

FsBase.prototype.put = function(req, res, next) {
	log.verbose("FsBase#put()");

	if (req.is('application/x-www-form-urlencoded')) {
		// carry a single file at most
		return this._putWebForm(req, res, next);
	} else if (req.is('multipart/form-data')) {
		// can carry several files
		return this._putMultipart(req, res, next);
	} else {
		setImmediate(next, new Error("Unhandled upload of content-type='" + req.headers['content-type'] + "'"));
	}
};

/**
 * Stores one file provided by a web form
 *
 * @param {HTTPRequest} req
 * @param {HTTPResponse} res
 * @param {Function} next(err, data) CommonJS callback
 */
FsBase.prototype._putWebForm = function(req, res, next) {
	// Mutually-agreed encoding of file name & location:
	// 'path' and 'name'
	var relPath, fileId, self = this,
	    pathParam = req.param('path'),
	    nameParam = req.param('name');
	log.verbose("FsBase#putWebForm()", "pathParam:", pathParam, "nameParam:", nameParam);
	if (!pathParam) {
		setImmediate(next, new HttpError("Missing 'path' request parameter", 400 /*Bad Request*/));
		return;
	}
	if (nameParam === '.'|| !nameParam) {
		relPath = pathParam;
	} else {
		relPath = [pathParam, nameParam].join('/');
	}

	// get the bits: base64-encoded binary in the 'content' field
	var buf;
	if (req.body.content) {
		buf = new Buffer(req.body.content, 'base64');
	} else {
		log.verbose("FsBase#putWebForm()", "empty file");
		buf = new Buffer('');
	}
		
	var urlPath = self.normalize(relPath);
	log.verbose("FsBase#putWebForm()", "storing file as", urlPath);
	fileId = self.encodeFileId(urlPath);
	self.putFile(req, {
		name: relPath,
		buffer: buf
	}, function(err){
		log.verbose("FsBase#putWebForm()", "err:", err);
		next(err, {
			code: 201, // Created
			body: [{
				id: fileId,
				path: urlPath,
				name: path.basename(urlPath),
				isDir: false
			}]
		});
	});
};

/**
 * Stores one or more files provided by a multipart form
 *
 * @param {HTTPRequest} req
 * @param {HTTPResponse} res
 * @param {Function} next(err, data) CommonJS callback
 * @see {ServiceBase._storeMultiPart}
 */
FsBase.prototype._putMultipart = function(req, res, next) {
	log.verbose("FsBase#_putMultipart()");

	var self =this;
	var nodes = [];
	var pathParam = req.param('path');

	this._storeMultipart(req, _putOne, _finish);

	function _putOne(file, next) {
		file.name = file.name ? [pathParam, file.name].join('/') : pathParam;
		self.putFile(req, file, function _done(err, node) {
			log.silly("FsBase#_putMultipart#_putOne#_done()", "err:", err, "node:", node);
			if (node) {
				nodes.push(node);
			}
			next();
		});
	}

	function _finish(err) {
		log.silly("FsBase#_putMultipart#_finish()", "nodes:", nodes);
		next(err, {
			code: 201, // Created
			body: nodes
		});
	}
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
