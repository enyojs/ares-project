/**
 * fsLocal.js -- Ares FileSystem (fs) provider, using local files.
 * 
 * This FileSystemProvider is both the simplest possible one
 * and a working sample for other implementations.
 */

// modules requirements

var fs = require("fs");
var path = require("path");
var express = require(path.resolve(__dirname, "node_modules/express"));
var util  = require('util');

// command-line arguments

function FsLocal(config) {

	// check major version

	var version = process.version.match(/[0-9]+.[0-9]+/)[0];
	if (version <= 0.7) {
		console.error("Only supported on Node.js version 0.8 and above");
		process.exit(1);
	}
	
	// express REST-ful framework configuration

	var app = express.createServer();

	app.use(cors);
	app.use(express.logger('dev'));
	//app.use(express.bodyParser()); // parses json, x-www-form-urlencoded, and multipart/form-data
	app.use(express.cookieParser()); // XXX useful?
	app.use(express.methodOverride()); // XXX useful?
	//app.enable('strict routing'); // XXX what for?
	app.all(config.urlPrefix + '/:verb/*', function(req, res) {
		if (req.connection.remoteAddress !== "127.0.0.1") {
			fail(res, "Access denied from IP address "+req.connection.remoteAddress);
		}

		req.params.root = config.root;
		req.params.id = req.params[0];
		req.params.path = decodeFileId(req.params.id);
		req.params.localPath = path.resolve(path.join(req.params.root, req.params.path));
		console.dir(req.params);

		if (verbs[req.params.verb]) {
			verbs[req.params.verb](req, res, respond);
		} else {
			respond("unknown verb="+req.params.verb);
		}
	});
	// error handler is the last one
	app.use(function(err, req, res, next){
		fail(res, err);
	});

	// start the filesystem (fs) server & notify the IDE server (parent) where to find it

	app.listen(config.port, "127.0.0.1", null /*backlog*/, function() {
		// Send back the URL to the IDE server, when port is actually bound
		var service = {
			url: "http://127.0.0.1:"+app.address().port.toString()+config.urlPrefix
		};
		console.log("available at "+service.url);
		process.send(service);
	});

	// utilities library

	function cors(req, res, next) {
		res.header('Access-Control-Allow-Origin', "*");
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		if ('OPTIONS' == req.method) {
			res.send(200);
		}
		else {
			next();
		}
	}

	function encodeFileId(path) {
		// ...or any other encoding whose value is unique for the
		// current root
		return encodeURIComponent(path);
	}

	function decodeFileId(id) {
		// reverse encodeFileId
		return decodeURIComponent(id);
	}

	function respond(err, data) {
		if (err) {
			return fail(res, err);
		} else {
			return success(res, {});
		}
	}

	function success(res, data) {
		if (data) {
			res.status(200).send(data);
		} else {
			res.status(200);
			res.end();
		}
	}

	function fail(res, err, code) {
		if (err instanceof Error) {
			console.error(err.stack);
			res.send(err.stack, code ? code : 500);
		} else {
			console.error(err);
			res.send(JSON.stringify({error: err}), code ? code: 403);
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
		get: {}, 	// verbs that are transmitted over an HTTP GET method
		post: {} 	// verbs that are transmitted over an HTTP POST method
	};
	
	verbs.get.propfind = function(req, res, next) {
		var depth = parseInt(req.param('depth'), 10) || 1;
		var localPath = req.params.localPath;
		return _propfind(localPath, path, depth, next);
	};

	var _propfind = function(localPath, relPath, depth, next) {
		if (relPath.basename(path).charAt(0) ===".") {
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
				name: relPath.basename(path),
				id: encodeFileId(relPath),
				isDir: stat.isDirectory()
			};

			console.dir(node);

			if (node.isDir) {
				node.contents = [];
				fs.readdir(localPath, function(err, files) {
					if (err) {
						return next(err); // XXX or skip this directory...
					}
					if (!files.length || !depth) {
						return next(null, node);
					}
					var count = files.length;
					files.forEach(function(name) {
						_propfind(path.join(localPath, name), path.join(relPath, name), depth-1, function(err, subNode){
							if (err) {
								return next(err);
							}
							node.contents.push(subNode);
							if (--count === 0) {
								// return to upper layer only if
								// every nodes of this layer
								// were successfully parsed
								return next(null, node);
							}
						});
					});
				});
			} else if (stat.isFile()) {
				return next(null, node);
			} else {
				// skip special files
				return next(null);
			}
		});
	};
	
	verbs.get.get = function(req, res, next) {
		fs.stat(req.params.localPath, function(err, stat) {
			if (err) {
				return next(err); // XXX be smarter about error codes
			}
			if (stat.isFile()) {
				// XXX use the below when we upload using express.bodyParser()
				/*
				var mimeType = _mimeTypes[path.extname(req.params.localPath).split(".")[1]];
				res.writeHead(200, {'Content-Type': mimeType} );
				var fileStream = fs.createReadStream(req.params.localPath);
				fileStream.pipe(res);
				return success(res);
				 */
				return fs.readFile(req.params.localPath, function(err, buffer) {
					return next(err, {content: buffer.toString('base64')});
				});
			} else {
				return next("Not a file"); // XXX be smarter about error codes
			}
		});
	};

	verbs.post.put = function (req, res, next) {
		// XXX replace application/json body by direct upload using multipart/form-data + express.bodyParser()
		var body = JSON.parse(req.body); // req.param('content') || ''
		var buffer = new Buffer(body.content, 'base64');
		fs.writeFile(req.params.localPath, buffer, function(err){
			// XXX success should return 201 (Created) if file did not exists before
			next(err, {id: req.params.id, path: req.params.path});
		});
	};

	verbs.post.mkcol = function(req, res, next) {
		fs.mkdir(req.params.localPath, function(err) {
			var error;
			if (!err) {
				next(null, {id: req.params.id, path: req.params.path});
			} else if (err.code === 'EEXIST') {
				error = new Error(err.path + ": already exists");
				error.http_code = 405; // Method Not Allowed
				next(error);
			} else {
				error = new Error(err.path + ": " + err.code);
				error.http_code = 500; // Internal Server Error
				next(error);
			}
		});
	};

	verbs.post.delete = function(req, res, next) {
		_rmrf(req.params.localPath, next);
	};

	function _rmrf(dir, next) {
		// from <https://gist.github.com/1526919>
		fs.stat(dir, function(err, stats) {
			if (err) {
				return next(err);
			}

			if (!stats.isDirectory()) {
				return fs.unlink(dir, next); // XXX success should return 204 (No Content)
			}

			var count = 0;
			fs.readdir(dir, function(err, files) {
				if (err) {
					return next(err);
				}

				if (files.length < 1) {
					return fs.rmdir(dir, next); // XXX success should return 204 (No Content)
				}

				files.forEach(function(file) {
					var sub = path.join(dir, file);

					_rmrf(sub, function(err) {
						if (err) {
							return next(err);
						}

						if (++count == files.length) {
							return fs.rmdir(dir, next);
						}
					});
				});
			});
		});
	}

	verbs.post.move = function(req, res, next) {
		// XXX improve status codes (see RFC4918, section 9.9.4)
		_changeNode(req, res, fs.rename, next);
	};

	verbs.post.copy = function(req, res, next) {
		// XXX improve status codes (see RFC4918, section 9.9.4)
		_changeNode(req, res, _cpr, next);
	};

	function _changeNode(req, res, op, next) {
		var newPath;
		if (req.param('name')) {
			// rename file within the same collection (folder)
			newPath = path.resolve(path.join(path.dirname(req.params.localPath),
							 path.basename(req.param('name'))));
		} else if (req.param('path')) {
			// move at a new location
			newPath = path.resolve(path.join(req.params.root, req.param('path')));
		} else {
			return next(new Error("missing parameter: name or path"));
		}
		return op(req.params.localPath, newPath, next);
	}

	function _cpr(srcPath, dstPath, next) {
		fs.stat(srcPath, function(err, stats) {
			var is, os;
			if (err) {
				return next(err);
			}
			if (stats.isDirectory()) {
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
			} else {
				is = fs.createReadStream(srcPath);
				os = fs.createWriteStream(dstPath);
				util.pump(is, os, next); // XXX success should return 201 (Created)
			}
		});
	}
}

if (path.basename(process.argv[1]) === "fsLocal.js") {
	// We are main.js: create & run the object...
	var fsLocal = new FsLocal({
		// urlPrefix (M) can be '/', '/res/files/' ...etc
		urlPrefix:	process.argv[2],
		// root (m) local filesystem access root absolute path
		root:		path.resolve(process.argv[3]),
		// port (o) local IP port of the express server (default: 9009, 0: dynamic)
		port: parseInt(process.argv[4] || "9009", 10)
	});
} else {
	// ... otherwise hook into commonJS module systems
	module.exports = fsLocal;
}
