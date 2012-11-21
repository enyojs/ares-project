/**
 * fsLocal.js -- Ares FileSystem (fs) provider, using local files.
 * 
 * This FileSystemProvider is both the simplest possible one
 * and a working sample for other implementations.
 */

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    http = require("http"),
    util  = require("util"),
    temp = require("temp"),
    mkdirp = require("mkdirp"),
    async = require("async"),
    querystring = require("querystring");

var basename = '(' + path.basename(__filename) + ')';

function FsLocal(config, next) {

	/**
	 * Generic HTTP Error
	 * 
	 * @private
	 */
	function HttpError(msg, statusCode) {
		Error.captureStackTrace(this, this);
		this.statusCode = statusCode || 500; // Internal-Server-Error
		this.message = msg || 'Error';
	}
	util.inherits(HttpError, Error);
	HttpError.prototype.name = "HTTP Error";

	// (simple) parameters checking
	config.root = path.resolve(config.root);
	if (config.verbose) console.log(basename, "config:" + util.inspect(config));

	// express-3.x
	/*
	var app = express(),
	    server = http.createServer(app); // XXX replace by HTTP server from config
	 */
	// express-2.x
	var app = express.createServer(),
	    server = app;

	app.use(express.logger('dev'));

	// CORS -- Cross-Origin Resources Sharing
	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', "*"); // XXX be safer than '*'
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

	// HTTP method overloading
	app.use(function(req, res, next) {
		//debugger;
		req.originalMethod = req.method;
		if (req.query._method) {
			req.method = req.query._method.toUpperCase();
		}
		if (!verbs[req.originalMethod] || 
		    !verbs[req.originalMethod][req.method]) {
			next(new Error("unknown originalMethod/method = "+req.originalMethod+"/"+req.method));
		} else {
			next();
		}
	});

	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.field[] & req.body.file[]
	var uploadDir = temp.path({prefix: 'com.palm.ares.hermes.bdPhoneGap'}) + '.d';
	fs.mkdirSync(uploadDir);
	app.use(express.bodyParser({keepExtensions: true, uploadDir: uploadDir}));

	/**
	 * Global error handler
	 * @private
	 */
	function errorHandler(err, req, res, next){
		console.error("errorHandler(): ", err.stack);
		respond(res, err);
	}

	if (app.error) {
		// express-2.x: explicit error handler
		app.error(errorHandler);
	} else {
		// express-3.x: middleware with arity === 4 is detected as the error handler
		app.use(errorHandler);
	}

	// Success
	function respond(res, err, response) {
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
			console.error("<<<\n"+body.stack);
		} else if (response) {
			statusCode = response.code || 200 /*Ok*/;
			body = response.body;
		}
		if (body) {
			res.status(statusCode).send(body);
		} else if (statusCode) {
			res.status(statusCode).end();
		}
	}
	
	var makeExpressRoute = function(path) {
		return (config.pathname + path)
			.replace(/\/+/g, "/") // compact "//" into "/"
			.replace(/(\.\.)+/g, ""); // remove ".."
	};

	// URL-scheme: ID-based file/folder tree navigation, used by
	// HermesClient.
	var idsRoot = makeExpressRoute('/id/');
	app.all(idsRoot, function(req, res) {
		req.params.id = encodeFileId('/');
		_handleRequest(req, res, next);
	});
	app.all(makeExpressRoute('/id/:id'), function(req, res, next) {
		_handleRequest(req, res, next);
	});

	// URL-scheme: WebDAV-like navigation, used by the Enyo
	// loader, itself used by the Enyo Javacript parser to analyze
	// the project source code.
	app.get(makeExpressRoute('/file/*'), function(req, res, next) {
		req.params.path = req.params[0];
		_getFile(req, res, respond.bind(this, res));
	});

	function _handleRequest(req, res, next) {
		if (config.verbose) console.log(basename, "req.query=" + util.inspect(req.query));
		req.params.id = req.params.id || encodeFileId('/');
		req.params.path = decodeFileId(req.params.id);
		if (config.verbose) console.log(basename, "req.params=" + util.inspect(req.params));
		verbs[req.originalMethod][req.method](req, res, respond.bind(this, res));
	}

	// start the filesystem (fs) server & notify the IDE server
	// (parent) where to find it

	server.listen(config.port, "127.0.0.1", null /*backlog*/, function() {
		// Send back the URL to the IDE server, when port is
		// actually bound
		var service = {
			origin: "http://127.0.0.1:"+server.address().port.toString(),
			pathname: config.pathname
		};
		return next(null, service);
	});

	/**
	 * Terminates express server
	 */
	this.quit = function() {
		server.close();
		console.log(basename, "exiting");
	};

	// utilities library

	function encodeFileId(relPath) {
		if (relPath) {
			return encodeURIComponent(relPath);
		} else {
			return undefined;
		}
	}

	function decodeFileId(id) {
		if (id) {
			return decodeURIComponent(id);
		} else {
			return undefined;
		}
	}

	// File-System (fs) verbs

	var verbs = {
		GET: {},	// verbs that are transmitted over an HTTP GET method
		POST: {}	// verbs that are transmitted over an HTTP POST method
	};
	
	verbs.GET.PROPFIND = function(req, res, next) {
		// 'infinity' is '-1', 'undefined' is '0'
		var depthStr = req.param('depth');
		var depth = depthStr ? (depthStr === 'infinity' ? -1 : parseInt(depthStr, 10)) : 1;
		_propfind(req.param('path'), depth, function(err, content){
			next(err, {code: 200 /*Ok*/, body: content});
		});
	};

	// XXX ENYO-1086: refactor tree walk-down
	var _propfind = function(relPath, depth, next) {
		var localPath = path.join(config.root, relPath);
		if (path.basename(relPath).charAt(0) ===".") {
			// Skip hidden files & folders (using UNIX
			// convention: XXX do it for Windows too)
			return next(null);
		}

		fs.stat(localPath, function(err, stat) {
			if (err) {
				return next(err);
			}

			// minimum common set of properties
			var node = {
				path: relPath,
				name: path.basename(relPath),
				id: encodeFileId(relPath),
				isDir: stat.isDirectory()
			};

			if (config.verbose) console.log(basename, "depth="+depth+", node="+util.inspect(node));

			if (stat.isFile() || !depth) {
				node.pathname = idsRoot + node.id; // same terminology as location.pathname
				return next(null, node);
			} else if (node.isDir) {
				node.children = [];
				fs.readdir(localPath, function(err, files) {
					if (err) {
						return next(err); // XXX or skip this directory...
					}
					if (!files.length) {
						return next(null, node);
					}
					var count = files.length;
					files.forEach(function(name) {
						_propfind(path.join(relPath, name), depth-1, function(err, subNode){
							if (err) {
								return next(err);
							}
							if (subNode) {
								node.children.push(subNode);
							}
							if (--count === 0) {
								// return to upper layer only if
								// every nodes of this layer
								// were successfully parsed
								return next(null, node);
							}
						});
					});
				});
			} else {
				// skip special files
				return next(null);
			}
		});
	};
	
	verbs.GET.GET = function(req, res, next) {
		_getFile(req, res, next);
	};
	
	function _getFile(req, res, next) {
		//debugger;
		var localPath = path.join(config.root, req.param('path'));
		if (config.verbose) console.log(basename, "sending localPath=" + localPath);
		fs.stat(localPath, function(err, stat) {
			if (err) {
				next(err);
				return;
			}
			if (stat.isFile()) {
				res.status(200);
				res.sendfile(localPath);
				// return nothing: streaming response
				// is already in progress.
				next();
			} else {
				next(new Error("not a file: '" + localPath + "'"));
			}
		});
	}

	verbs.POST.PUT = function(req, res, next) {
		if (config.verbose) console.log(basename, "put(): req.headers", req.headers);
		if (config.verbose) console.log(basename, "put(): req.body", req.body);

		if (req.is('application/x-www-form-urlencoded')) {
			// carry a single file at most
			return _putWebForm(req, res, next);
		} else if (req.is('multipart/form-data')) {
			// can carry several files
			return _putMultipart(req, res, next);
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
	function _putWebForm(req, res, next) {
		// Mutually-agreed encoding of file name & location:
		// 'path' and 'name'
		var relPath,
		    pathParam = req.param('path'),
		    nameParam = req.param('name');
		if (!pathParam) {
			next(new HttpError("Missing 'path' request parameter", 400 /*Bad Request*/));
			return;
		}
		if (nameParam) {
			relPath = path.join(pathParam, path.basename(nameParam));
		} else {
			relPath = pathParam;
		}

		// Now get the bits: base64-encoded binary in the
		// 'content' field
		var buf;
		if (req.body.content) {
			buf = new Buffer(req.body.content, 'base64');
		} else {
			if (config.verbose) console.log(basename, "putWebForm(): empty file");
			buf = '';
		}
		
		if (config.verbose) console.log(basename, "putWebForm(): storing file as", relPath);
		fs.writeFile(path.join(config.root, relPath), buf, function(err){
			next(err, {
				code: 201, // Created
				body: [{id: encodeFileId(relPath), path: relPath, isDir: false}]
			});
		});
	}

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
	function _putMultipart(req, res, next) {
		if (!req.files.file) {
			next(new HttpError("No file found in the multipart request", 400 /*Bad Request*/));
			return;
		}
		var nodes = [];
		async.forEachSeries(req.files.file, function(file, cb) {
			var dir = path.join(config.root, path.dirname(file.name));
			if (config.verbose) console.log(basename, "putMultipart(): mkdir -p ", dir);
			mkdirp(dir, function(err) {
				if (config.verbose) console.log(basename, "putMultipart(): mv ", file.path, " ", file.name);
				if (err) {
					cb(err);
					return;
				}
				var id = encodeFileId(file.name);
				fs.rename(file.path, path.join(config.root, file.name), function(err) {
					if (err) {
						cb(err);
						return;
					}
					nodes.push({id: id, path: file.path, isDir: false});
					cb();
				});
			});
		}, function(err){
			next(err, {
				code: 201, // Created
				body: nodes
			});
		});
	}

	verbs.POST.MKCOL = function(req, res, next) {
		var newPath, newId,
		    pathParam = req.param('path'),
		    nameParam = req.param('name');
		if (!nameParam) {
			next(new HttpError("missing 'name' query parameter", 400 /*Bad-Request*/));
			return;
		}
		newPath = path.join(pathParam, path.basename(nameParam));
		newId = encodeFileId(newPath);

		fs.mkdir(path.join(config.root, newPath), function(err) {
			next(err, {
				code: 201, // Created
				body: {id: newId, path: newPath, isDir: true}
			});
		});
	};

	verbs.POST.DELETE = function(req, res, next) {
		var pathParam = req.param('path'),
		    localPath = path.join(config.root, pathParam);
		if (localPath === config.root) {
			next(new HttpError("Not allowed to remove service root", 403 /*Forbidden*/));
		} else {
			_rmrf(path.join(config.root, pathParam), function(err) {
				if (err) {
					next(err);
				}
				// return the new content of the parent folder
				_propfind(path.dirname(pathParam), 1 /*depth*/, function(err, content) {
					next(err, {
						code: 200 /*Ok*/,
						body: content
					});
				});
			});
		}
	};

 	// XXX ENYO-1086: refactor tree walk-down
	function _rmrf(localPath, next) {
		// from <https://gist.github.com/1526919>
		fs.stat(localPath, function(err, stats) {
			if (err) {
				return next(err);
			}

			if (!stats.isDirectory()) {
				return fs.unlink(localPath, next);
			}

			var count = 0;
			fs.readdir(localPath, function(err, files) {
				if (err) {
					return next(err);
				}

				if (files.length < 1) {
					return fs.rmdir(localPath, next);
				}

				files.forEach(function(file) {
					var sub = path.join(localPath, file);

					_rmrf(sub, function(err) {
						if (err) {
							return next(err);
						}

						if (++count == files.length) {
							return fs.rmdir(localPath, next);
						}
					});
				});
			});
		});
	}

	verbs.POST.MOVE = function(req, res, next) {
		_changeNode(req, res, fs.rename, next);
	};

	verbs.POST.COPY = function(req, res, next) {
		_changeNode(req, res, _cpr, next);
	};

 	// XXX ENYO-1086: refactor tree walk-down
	function _changeNode(req, res, op, next) {
		var pathParam = req.param('path'),
		    nameParam = req.param('name'),
		    folderIdParam = req.param('folderId'),
		    overwriteParam = req.param('overwrite'),
		    srcPath = path.join(config.root, pathParam);
		var dstPath, dstRelPath;
		if (nameParam) {
			// rename/copy file within the same collection (folder)
			dstRelPath = path.join(path.dirname(pathParam),
					       path.basename(nameParam));
		} else if (folderIdParam) {
			// move/copy at a new location
			dstRelPath = path.join(decodeFileId(folderIdParam),
					       path.basename(pathParam));
		} else {
			next(new HttpError("missing query parameter: 'name' or 'folderId'", 400 /*Bad-Request*/));
			return;
		}
		dstPath = path.join(config.root, dstRelPath);
		if (srcPath === dstPath) {
			next(new HttpError("trying to move a resource onto itself", 400 /*Bad-Request*/));
			return;
		}
		fs.stat(dstPath, function(err, stat) {
			// see RFC4918, section 9.9.4 (MOVE Status
			// Codes) & section 9.8.5 (COPY Status Codes).
			if (err) {
				if (err.code === 'ENOENT') {
					// Destination resource does not exist yet
					op(srcPath, dstPath, function(err) {
						if (err) {
							next(err);
						} else {
							// return the new content of the destination path
							_propfind(dstRelPath, 1 /*depth*/, function(err, content) {
								next(err, {
									code: 201 /*Created*/,
									body: content
								});
							});
						}
					});
				} else {
					next(err);
				}
			} else if (stat) {
				if (overwriteParam) {
					// Destination resource already exists : destroy it first
					_rmrf(dstPath, function(err) {
						op(srcPath, dstPath, function(err) {
							//next(err, { code: 204 /*No-Content*/ });
							if (err) {
								next(err);
							} else {
								// return the new content of the destination path
								_propfind(dstRelPath, 1 /*depth*/, function(err, content) {
									next(err, {
										code: 200 /*Ok*/,
										body: content
									});
								});
							}
						});
					});
				} else {
					next(new HttpError('Destination already exists', 412 /*Precondition-Failed*/));
				}
			}
		});
	}

 	// XXX ENYO-1086: refactor tree walk-down
	function _cpr(srcPath, dstPath, next) {
		if (srcPath === dstPath) {
			return next(new Error("Cannot copy on itself"));
		}
		function _copyFile(srcPath, dstPath, next) {
			var is, os;
			is = fs.createReadStream(srcPath);
			os = fs.createWriteStream(dstPath);
			util.pump(is, os, next); // XXX should return 201 (Created) on success
		}
		function _copyDir(srcPath, dstPath, next) {
			var count = 0;
			fs.readdir(srcPath, function(err, files) {
				if (err) {
					return next(err);
				}
				fs.mkdir(dstPath, function(err) {
					if (err) {
						return next(err);
					}
					if (files.length >= 1) {
						files.forEach(function(file) {
							var sub = path.join(dstPath, file);
							
							_cpr(path.join(srcPath, file), path.join(dstPath, file), function(err) {
								if (err) {
									return next(err);
								}
								
								if (++count == files.length) {
									return next(null);
								}
							});
						});
					}
				});
			});
		}
		fs.stat(srcPath, function(err, stats) {
			if (err) {
				return next(err);
			}
			if (stats.isDirectory()) {
				_copyDir(srcPath, dstPath, next);
			} else if (stats.isFile()){
				_copyFile(srcPath, dstPath, next);
			}
		});
	}
}

if (path.basename(process.argv[1]) === "fsLocal.js") {
	// We are main.js: create & run the object...
	
	var argv = require("optimist")
	.usage('\nAres FileSystem (fs) provider.\nUsage: "$0 [OPTIONS]"')
	.options('P', {
		alias : 'pathname',
		description: 'pathname (M) can be "/", "/res/files/" ...etc'
	})
	.demand('P')
	.options('p', {
		alias : 'port',
		description: 'port (o) local IP port of the express server (default: 9009, 0: dynamic)',
		default : '9009'
	})
	.options('h', {
		alias : 'help',
		description: 'help message',
		boolean: true
	})
	.options('v', {
		alias : 'verbose',
		description: 'verbose execution mode',
		boolean: true
	})
	.argv;
	
	var version = process.version.match(/[0-9]+.[0-9]+/)[0];
	if (version <= 0.7) {
		process.exit("Only supported on Node.js version 0.8 and above");
	}

	var fsLocal = new FsLocal({
		pathname: argv.pathname,
		port: argv.port,
		verbose: argv.verbose,
		root: argv._[0]
	}, function(err, service){
		err && process.exit(err);
		// process.send() is only available if the
		// parent-process is also node
		process.send && process.send(service);
	});

} else {

	// ... otherwise hook into commonJS module systems
	module.exports = FsLocal;
};
