/**
 * fsLocal.js -- Ares FileSystem (fs) provider, using local files.
 * 
 * This FileSystemProvider is both the simplest possible one
 * and a working sample for other implementations.
 */

var fs = require("fs");
var path = require("path");
var express = require("express");
var util  = require("util");
var querystring = require("querystring");

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

	config.root = path.resolve(config.root);

	/**
	 * Express server instance
	 * 
	 * @private
	 */
	var app = express.createServer();

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

	// Error handler (4 parameters)
	app.use(function(err, req, res, next){
		respond(res, err);
	});

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
			console.error(body.stack);
		} else {
			statusCode = response.code || 200;
			body = response.body;
		}
		if (body) {
			res.status(statusCode).send(body);
		} else {
			res.status(statusCode).end();
		}
	}
	
	//app.use(express.bodyParser()); // parses json, x-www-form-urlencoded, and multipart/form-data
	//app.enable('strict routing'); // XXX what for?

	app.all(path.join(config.urlPrefix, 'id/'), function(req, res) {
		req.params.id = encodeFileId('/');
		_handleRequest(req, res, next);
	});
	app.all(path.join(config.urlPrefix, '/id/:id'), function(req, res, next) {
		_handleRequest(req, res, next);
	});

	function _handleRequest(req, res, next) { 
		console.log("req.query=" + util.inspect(req.query));
		req.params.id = req.params.id || encodeFileId('/');
		req.params.path = decodeFileId(req.params.id);
		_loadRequestParams(req, res, function() {
			console.log("req.params=" + util.inspect(req.params));
			verbs[req.originalMethod][req.method](req, res, respond.bind(this, res));
		});
	}

	function _loadRequestParams(req, res, next) {
		for (var param in req.query) {
			req.params[param] = req.query[param];
		}
		if (req.headers['content-type'] === 'application/x-www-form-urlencoded') { 
			var chunks = [];
			req.on('data', function(chunk) {
				chunks.push(chunk);
			});
			req.on('end', function() {
				req.form = querystring.parse(Buffer.concat(chunks).toString());
				console.log("req.form=");
				console.dir(req.form);
				for (var param in req.form) {
					req.params[param] = req.form[param];
				}
				next();
			});
		} else {
			next();
		}
	}

	// start the filesystem (fs) server & notify the IDE server
	// (parent) where to find it

	app.listen(config.port, "127.0.0.1", null /*backlog*/, function() {
		// Send back the URL to the IDE server, when port is
		// actually bound
		var service = {
			url: "http://127.0.0.1:"+app.address().port.toString()+config.urlPrefix
		};
		return next(null, service);
	});

	/**
	 * Terminates express server
	 */
	this.quit = function() {
		app.close();
		console.log("fsLocal exiting");
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

	// Served files

	var _mimeTypes = {
		"html": "text/html",
		"jpeg": "image/jpeg",
		"jpg": "image/jpeg",
		"png": "image/png",
		"js": "text/javascript",
		"css": "text/css"
	};

	// File-System (fs) verbs

	var verbs = {
		GET: {},	// verbs that are transmitted over an HTTP GET method
		POST: {}	// verbs that are transmitted over an HTTP POST method
	};
	
	verbs.GET.PROPFIND = function(req, res, next) {
		// 'infinity' is '-1', 'undefined' is '0'
		var depth = req.params.depth ? (req.params.depth === 'infinity' ? -1 : parseInt(req.params.depth, 10)) : 1;
		_propfind(req.params.path, depth, function(err, content){
			next(err, {code: 200, body: content});
		});
	};

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

			console.log("depth="+depth+", node=");
			console.dir(node);

			if (stat.isFile() || !depth) {
				return next(null, node);
			} else if (node.isDir) {
				node.contents = [];
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
								node.contents.push(subNode);
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
		var localPath = path.join(config.root, req.params.path);
		fs.stat(localPath, function(err, stat) {
			if (err) {
				return next(err);
			}
			if (stat.isFile()) {
				// XXX use the below when/if we upload using express.bodyParser()
				/*
				 var mimeType = _mimeTypes[path.extname(req.params.path).split(".")[1]];
				 res.writeHead(200, {'Content-Type': mimeType} );
				 var fileStream = fs.createReadStream(localPath);
				 fileStream.pipe(res);
				 next();
				 */
				return fs.readFile(localPath, function(err, buffer) {
					return next(err, {
						code: 200,
						body: { content: buffer.toString('base64') }
					});
				});
			} else {
				return next(new Error("Not a file"));
			}
		});
	};

	verbs.POST.PUT = function (req, res, next) {
		var bufs = []; 	// Buffer's
		var newPath, newId;
		if (!req.params.name) {
			next(new Error("missing 'name' query parameter"));
			return;
		}
		newPath = path.join(req.params.path, path.basename(req.params.name));
		newId = encodeFileId(newPath);

		// XXX replace/enhance application/json body by
		// - direct upload using multipart/form-data + express.bodyParser()
		// - straight binary in body (+streamed pipes)

		//if (req.headers['content-type'] !== 'application/json; charset=utf-8') {
		//	next(new Error("unexpected 'content-type'="+req.headers['content-type']));
		//}

		req.on('data', function(chunk) {
			bufs.push(chunk);
		});
		req.on('end', function() {
			var bodyStr = Buffer.concat(bufs).toString();
			var bodyObj = JSON.parse(bodyStr);
			var content = new Buffer(bodyObj.content, 'base64');
			fs.writeFile(path.join(config.root, newPath), content, function(err){
				next(err, {
					code: 201, // Created
					body: {id: newId, path: newPath, isDir: false}
				});
			});
		});

	};

	verbs.POST.MKCOL = function(req, res, next) {
		var newPath, newId;
		if (!req.params.name) {
			next(new HttpError("missing 'name' query parameter", 400 /*Bad-Request*/));
			return;
		}
		newPath = path.join(req.params.path, path.basename(req.params.name));
		newId = encodeFileId(newPath);

		fs.mkdir(path.join(config.root, newPath), function(err) {
			next(err, {
				code: 201, // Created
				body: {id: newId, path: newPath, isDir: true}
			});
		});
	};

	verbs.POST.DELETE = function(req, res, next) {
		var localPath = path.join(config.root, req.params.path);
		if (localPath === config.root) {
			var err = new Error("Not allowed to remove service root");
			err.http_code = 403 /*Forbidden*/;
			next(err);
		} else {
			_rmrf(path.join(config.root, req.params.path), function(err) {
				next(err, { code: 204 /*No Content*/ });
			});
		}
	};

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

	function _changeNode(req, res, op, next) {
		var srcPath = path.join(config.root, req.params.path);
		var dstPath;
		if (req.params.name) {
			// rename/copy file within the same collection (folder)
			dstPath = path.join(config.root,
					    path.dirname(req.params.path),
					    path.basename(req.params.name));
		} else if (req.params.folderId) {
			// move/copy at a new location
			dstPath = path.join(config.root,
					    decodeFileId(req.params.folderId),
					    path.basename(req.params.path));
		} else {
			next(new HttpError("missing query parameter: 'name' or 'folderId'", 400 /*Bad-Request*/));
			return;
		}
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
						next(err, { code: 201 /*Created*/ });
					});
				} else {
					next(err);
				}
			} else if (stat) {
				console.trace("req.params=" + util.inspect(req.params));
				if (req.params.overwrite) {
					// Destination resource already exists : destroy it first
					_rmrf(dstPath, function(err) {
						op(srcPath, dstPath, function(err) {
							next(err, { code: 204 /*No-Content*/ });
						});
					});
				} else {
					next(new HttpError('Destination already exists', 412 /*Precondition-Failed*/));
				}
			}
		});
	}

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

//debugger;

if (path.basename(process.argv[1]) === "fsLocal.js") {
	// We are main.js: create & run the object...

	var version = process.version.match(/[0-9]+.[0-9]+/)[0];
	if (version <= 0.7) {
		process.exit("Only supported on Node.js version 0.8 and above");
	}

	var fsLocal = new FsLocal({
		// urlPrefix (M) can be '/', '/res/files/' ...etc
		urlPrefix:	process.argv[2],
		// root (m) local filesystem access root absolute path
		root:		path.resolve(process.argv[3]),
		// port (o) local IP port of the express server (default: 9009, 0: dynamic)
		port: parseInt(process.argv[4] || "9009", 10)
	}, function(err, service){
		if (err) {
			process.exit(err);
		}
		console.log("fsLocal['"+process.argv[3]+"'] available at "+service.url);
		if (process.send) {
			// only possible/available if parent-process is node
			process.send(service);
		}
	});

} else {

	// ... otherwise hook into commonJS module systems
	module.exports = FsLocal;
}
