/* jshint node:true */
/**
 * fsLocal.js -- Ares FileSystem (fs) provider, using local files.
 * 
 * This FileSystemProvider is both the simplest possible one
 * and a working sample for other implementations.
 */

// nodejs version checking is done in parent process ide.js

var fs = require("graceful-fs"),
    path = require("path"),
    util  = require("util"),
    mkdirp = require("mkdirp"),
    async = require("async"),
    log = require('npmlog'),
    copyFile = require("./lib/copyFile"),
    FsBase = require("./lib/fsBase"),
    HttpError = require("./lib/httpError");

var basename = path.basename(__filename, '.js');

/**
 * Ares local file-system service
 * @see {FsBase}
 * @param {Object} config
 * @property config {String} root local file-system folder that serves as root
 * @public
 */
function FsLocal(config, next) {
	// Use absolute local path
	config.root = path.resolve(config.root);

	// inherits FsBase (step 1/2)
	FsBase.call(this, config, next);
}

// inherits FsBase (step 2/2)
util.inherits(FsLocal, FsBase);

FsLocal.prototype._statusCodes = {
	'ENOENT': 404, // Not-Found
	'EPERM' : 403, // Forbidden
	'EEXIST': 409, // Conflict
	'ETIMEDOUT': 408 // Request-Timed-Out
};

FsLocal.prototype.errorResponse = function(err) {
	log.warn("FsLocal#errorResponse()", "err:", err);
	var response = {
		code: 403,	// Forbidden
		body: err.toString()
	};
	if (err instanceof Error) {
		response.code = err.statusCode ||
			this._statusCodes[err.code] ||
			this._statusCodes[err.errno] ||
			403; // Forbidden
		response.body = err.toString();
		delete err.statusCode;
		log.warn("FsLocal#errorResponse()", err.stack);
	}
	log.verbose("FsLocal#errorResponse()", "response:", response);
	return response;
};

FsLocal.prototype.propfind = function(req, res, next) {
	// 'infinity' is '-1', 'undefined' is '0'
	var depthStr = req.param('depth');
	var depth = depthStr ? (depthStr === 'infinity' ? -1 : parseInt(depthStr, 10)) : 1;
	this._propfind(null, req.param('path'), depth, function(err, content){
		log.verbose("FsLocal#propfind()", "content:", content);
		next(err, {code: 200 /*Ok*/, body: content});
	});
};

FsLocal.prototype.move = function(req, res, next) {
	this._changeNode(req, res, fs.rename, next);
};

FsLocal.prototype.copy = function(req, res, next) {
	this._changeNode(req, res, this._cpr, next);
};

FsLocal.prototype.get = function(req, res, next) {
	this._getFile(req, res, next);
};

FsLocal.prototype.mkcol = function(req, res, next) {
	var newPath, newId, newName, self = this,
	    pathParam = req.param('path'),
	    nameParam = req.param('name'),
	    overwriteParam = req.param('overwrite') !== "false";
	log.verbose("FsLocal#mkcol()", "pathParam:", pathParam);
	log.verbose("FsLocal#mkcol()", "nameParam:", nameParam);
	if (!nameParam) {
		setImmediate(next, new HttpError("missing 'name' query parameter", 400 /*Bad-Request*/));
		return;
	}
	newPath = path.relative('.', path.join('.', pathParam, nameParam));
	log.verbose("FsLocal#mkcol()", "newPath:", newPath);
	if (newPath[0] === '.') {
		setImmediate(next, new HttpError("Attempt to navigate beyond the root folder: '" + newPath + "'", 403 /*Forbidden*/));
		return;
	}
	newPath = '/' + self.normalize(newPath);
	newName = path.basename(newPath);
	newId = this.encodeFileId(newPath);

	var absPath = path.join(this.config.root, newPath);
	async.series([
		this._checkOverwrite.bind(this, absPath, overwriteParam),
		mkdirp.bind(null, absPath)
	], function(err) {
		if (err) {
			next(err);
		} else {
			next(null, {
				code: 201, // Created
				body: {
					id: newId,
					path: newPath,
					name: newName,
					isDir: true
				}
			});
		}
	});
};

FsLocal.prototype['delete'] = function(req, res, next) {
	var pathParam = req.param('path'),
	    localPath = path.join(this.config.root, pathParam);
	if (localPath === this.config.root) {
		setImmediate(next, new HttpError("Not allowed to remove service root", 403 /*Forbidden*/));
	} else {
		this._rmrf(path.join(this.config.root, pathParam), (function(err) {
			// return the new content of the parent folder
			this._propfind(err, path.dirname(pathParam), 1 /*depth*/, function(err, content) {
				next(err, {
					code: 200 /*Ok*/,
					body: content
				});
			});
		}).bind(this));
	}
};

FsLocal.prototype._propfind = function(err, relPath, depth, next) {
	if (err) {
		setImmediate(next, err);
		return;
	}

	var localPath = path.join(this.config.root, relPath),
            urlPath = this.normalize(relPath);
	if (path.basename(relPath).charAt(0) ===".") {
		// Skip hidden files & folders (using UNIX
		// convention: XXX do it for Windows too)
		setImmediate(next);
		return;
	}

	fs.stat(localPath, (function(err, stat) {
		if (err) {
			next(err);
			return;
		}

		// minimum common set of properties
		var node = {
			path: urlPath,
			name: path.basename(urlPath),
			id: this.encodeFileId(urlPath),
			isDir: stat.isDirectory()
		};

		// Give the top-level node the name (NOT the path) of the mount-point
		if (node.name === '') {
			node.name = path.basename(this.config.root);
		}

		log.silly("FsLocal#_propfind()", "relPath=" + relPath + ", depth="+depth+", node="+util.inspect(node));

		if (stat.isFile() || !depth) {
			next(null, node);
			return;
		} else if (node.isDir) {
			node.children = [];
			fs.readdir(localPath, (function(err, files) {
				if (err) {
					next(err); // XXX or skip this directory...
					return;
				}
				if (!files.length) {
					next(null, node);
					return;
				}
				//to skip the files which user doesn't have permission to read
				files = files.filter(function(name){
					return fs.existsSync(path.join(localPath, name));
				});
				var count = files.length;
				files.forEach(function(name) {
					this._propfind(null, path.join(relPath, name), depth-1, function(err, subNode){
						if (err) {
							next(err);
							return;
						}
						if (subNode) {
							node.children.push(subNode);
						}
						if (--count === 0) {
							// return to upper layer only if
							// every nodes of this layer
							// were successfully parsed
							next(null, node);
						}
					});
				}, this);
			}).bind(this));
		} else {
			// skip special files
			setImmediate(next);
		}
	}).bind(this));
};

FsLocal.prototype._getFile = function(req, res, next) {
	var self = this;
	var relPath = req.param('path');
	var localPath = path.join(this.config.root, relPath);
	log.verbose("FsLocal#_getFile()", "sending localPath=" + localPath);
	fs.stat(localPath, function(err, stat) {
		if (err) {
			setImmediate(next, err);
			return;
		}
		if (stat.isFile()) {
			self._propfind(err, relPath, 0 /*depth*/, function(err, node) {
				res.setHeader('x-ares-node', JSON.stringify(node));
				res.status(200);
				res.sendfile(localPath);
				// return nothing: streaming response
				// is already in progress.
				setImmediate(next);
			});
		} else if (stat.isDirectory() && req.param('format') === 'base64') {
			
			// Return the folder content as a FormData filled with base64 encoded file content
			
			var depthStr = req.param('depth');
			var depth = depthStr ? (depthStr === 'infinity' ? -1 : parseInt(depthStr, 10)) : 1;
			log.verbose("FsLocal#_getFile()", "Preparing dir in base64, depth: " + depth + " " + localPath);
			self._propfind(null, req.param('path'), depth, function(err, content){
				var parts = [];
				
				function addParts(entries) {
					entries.forEach(function(entry) {
						if (entry.isDir) {
							addParts(entry.children);
						} else {
							var part = {
								name: entry.path.substr(content.path.length + 1),
								path: path.join(localPath, entry.path.substr(content.path.length))
							};
							log.silly("FsLocal#_getFile()", "adding part: ", part);
							parts.push(part);
						}
					});
				}
				
				addParts(content.children);
				self.returnFormData(parts, res, next);
			});
			
		} else {
			next(new Error("not a file: '" + localPath + "'"));
		}
	});
};

// XXX ENYO-1086: refactor tree walk-down
FsLocal.prototype._rmrf = function(localPath, next) {
	// from <https://gist.github.com/1526919>
	fs.stat(localPath, (function(err, stats) {
		if (err) {
			next(err);
			return;
		}

		if (!stats.isDirectory()) {
			return fs.unlink(localPath, next);
		}

		var count = 0;
		fs.readdir(localPath, (function(err, files) {
			if (err) {
				next(err);
			} else if (files.length < 1) {
				fs.rmdir(localPath, next);
			} else {
				files.forEach(function(file) {
					var sub = path.join(localPath, file);
					
					this._rmrf(sub, function(err) {
						if (err) {
							next(err);
							return;
						}
						
						if (++count == files.length) {
							return fs.rmdir(localPath, next);
						}
					});
				}, this);
			}
		}).bind(this));
	}).bind(this));
};

FsLocal.prototype.putFile = function(req, file, next) {
	var absPath = path.join(this.config.root, file.name),
            urlPath = this.normalize(file.name),
	    dir = path.dirname(absPath),
	    encodeFileId = this.encodeFileId,
	    overwriteParam = req.param('overwrite') !== "false",
	    node;
	
	log.verbose("FsLocal#putFile()", "file.name:", file.name, "-> absPath:", absPath);
	
	async.series([
		this._checkOverwrite.bind(this, absPath, overwriteParam),
		mkdirp.bind(null, dir),
		function(next) {
			if (file.path) {
				log.verbose("FsLocal#putFile()", "moving/copying file");
				try {
					fs.renameSync(file.path, absPath);
					setImmediate(next);
				} catch(err) {
					log.verbose("FsLocal#putFile()", "err:", err.toString());
					if (err.code === 'EXDEV') {
						log.verbose("FsLocal#putFile()", "COPY+REMOVE file:", file.path, "-> absPath:", absPath);
						async.series([
							copyFile.bind(undefined, file.path, absPath),
							fs.unlink.bind(fs, file.path)
						], next);
					} else {
						throw err;
					}
				}
			} else if (file.buffer) {
				log.silly("FsLocal#putFile()", "writing buffer");
				fs.writeFile(absPath, file.buffer, next);
			} else if (file.stream) {
				log.silly("FsLocal#putFile()", "writing stream");
				var out = fs.createWriteStream(absPath);
				out.on('close', function() {
					log.silly("FsLocal#putFile()", "on-close, file.name:", file.name);
					next();
				});
				out.on('error', function(err) {
					log.silly("FsLocal#putFile()", "output file.name:", file.name, "on-err:", err);
					next(err);
				});
				file.stream.on('error', function(err) {
					log.warn("FsLocal#putFile()", "input file.name:", file.name, "on-err:", err);
					next(err);
				});
				file.stream.on('end', function() {
					log.silly("FsLocal#putFile()", "on-end: input");
				});
				file.stream.pipe(out, { end: true });
			} else {
				setImmediate(next, new HttpError("cannot write file=" + JSON.stringify(file), 400));
			}
		},
		function(next){
			log.verbose("FsLocal#putFile()", "wrote: file.name:", file.name);
			node = {
				id: encodeFileId(urlPath),
				path: urlPath,
				name: path.basename(urlPath),
				isDir: false
			};
			setImmediate(next);
		}
	], function(err) {
		next(err, node);
	});
};

FsLocal.prototype._checkOverwrite = function(absPath, overwrite, next) {
	if (!overwrite) {
		fs.stat(absPath, function(err, stat) {
			if (err) {
				if (err.code === 'ENOENT') {
					/* normal */
					next();
				} else {
					/* wrong */
					next(new HttpError('Destination already exists', 412 /*Precondition-Failed*/));
				}
			} else {
				/* wrong */
				next(new HttpError('Destination already exists', 412 /*Precondition-Failed*/));
			}
		});
	} else {
		setImmediate(next);
	}
};

// XXX ENYO-1086: refactor tree walk-down
FsLocal.prototype._changeNode = function(req, res, op, next) {
	var pathParam = req.param('path'),
	    nameParam = req.param('name'),
	    folderIdParam = req.param('folderId'),
	    overwriteParam = req.param('overwrite') !== "false",
	    srcPath = path.join(this.config.root, pathParam);
	var dstPath, dstRelPath;
	var srcStat, dstStat;
	if (nameParam) {
		// rename/copy file within the same collection (folder)
		dstRelPath = path.join(path.dirname(pathParam),
				       path.basename(nameParam));
	} else if (folderIdParam) {
		// move/copy at a new location
		dstRelPath = path.join(this.decodeFileId(folderIdParam),
				       path.basename(pathParam));
	} else {
		setImmediate(next, new HttpError("missing query parameter: 'name' or 'folderId'", 400 /*Bad-Request*/));
		return;
	}
	dstPath = path.join(this.config.root, dstRelPath);
	if (srcPath === dstPath) {
		setImmediate(next, new HttpError("trying to move a resource onto itself", 400 /*Bad-Request*/));
		return;
	}
	async.waterfall([
		fs.stat.bind(this, srcPath),
		function(stat, next) {
			srcStat = stat;
			fs.stat(dstPath, next);
	    },
	    function(stat, next) {
			dstStat = stat;
			setImmediate(next);
	    }
	], function(err) {
		// see RFC4918, section 9.9.4 (MOVE Status
		// Codes) & section 9.8.5 (COPY Status Codes).
		if (err) {
			if (err.code === 'ENOENT') {
				if (err.path === srcPath) {
					/* srcPath doesn't exist */
					setImmediate(next, new HttpError("resouce does not exist", 400 /*Bad-Request*/));
					return;
				} else {
					/* dstPath doesn't exist */
					// Destination resource does not exist yet
					op(srcPath, dstPath, (function(err) {
						// return the new content of the destination path
						this._propfind(err, dstRelPath, 1 /*depth*/, function(err, content) {
							next(err, {
								code: 201 /*Created*/,
								body: content
							});
						});
					}).bind(this));
				}
			} else {
				/* unknown error */
				setImmediate(next, err);
			}
		} else {
			/* dstPath exist */
			if (overwriteParam) {
				// Destination resource already exists : destroy it first
				this._rmrf(dstPath, (function(err) {
					op(srcPath, dstPath, (function(err) {
						this._propfind(err, dstRelPath, 1 /*depth*/, function(err, content) {
							next(err, {
								code: 200 /*Ok*/,
								body: content
							});
						});
					}).bind(this));
				}).bind(this));
			} else {
				if (req.method.match(/MOVE/i) &&
				    (srcStat.ino === dstStat.ino) &&
				    (srcStat.mtime.getTime() === dstStat.mtime.getTime())) {
					op(srcPath, dstPath, (function(err) {
						this._propfind(err, dstRelPath, 1 /*depth*/, function(err, content) {
							next(err, {
								code: 200 /*Ok*/,
								body: content
							});
						});
					}).bind(this));
				} else { 
					setImmediate(next, new HttpError('Destination already exists', 412 /*Precondition-Failed*/));
				}
			}
		}
	}.bind(this));
};

// XXX ENYO-1086: refactor tree walk-down
FsLocal.prototype._cpr = function(srcPath, dstPath, next) {
	if (srcPath === dstPath) {
		setImmediate(next, new HttpError("Cannot copy on itself", 400 /*Bad Request*/));
		return;
	}
	_copyNode(srcPath, dstPath, next);
	function _copyNode(srcPath, dstPath, next) {
		fs.stat(srcPath, function(err, stats) {
			if (err) {
				next(err);
				return;
			}
			if (stats.isDirectory()) {
				_copyDir(srcPath, dstPath, next);
			} else if (stats.isFile()){
				copyFile(srcPath, dstPath, next);
			}
		});
	}
	function _copyDir(srcPath, dstPath, next) {
		fs.readdir(srcPath, function(err, files) {
			if (err) {
				next(err);
				return;
			}
			fs.mkdir(dstPath, function(err) {
				if (err) {
					next(err);
					return;
				}
				async.forEachSeries(files, function(file, next) {
					_copyNode(path.join(srcPath, file), path.join(dstPath, file), next);
				}, next);
			});
		});
	}
};

// module/main wrapper

if (path.basename(process.argv[1], '.js') === basename) {
	// We are main.js: create & run the object...
	
	var knownOpts = {
		"root":		path,
		"port":		Number,
		"timeout":	Number,
		"pathname":	String,
		"level":	['silly', 'verbose', 'info', 'http', 'warn', 'error'],
		"help":		Boolean
	};
	var shortHands = {
		"r": "--root",
		"p": "--port",
		"t": "--timeout",
		"P": "--pathname",
		"l": "--level",
		"v": "--level verbose",
		"h": "--help"
	};
	var opt = require('nopt')(knownOpts, shortHands, process.argv, 2 /*drop 'node' & basename*/);
	opt.level = opt.level || "http";
	opt.pathname = opt.pathname || "/files";
	opt.port = opt.port || 0;
	opt.timeout = opt.timeout || (2*60*1000);
	if (opt.help) {
		console.log("Usage: node " + basename + "\n" +
			    "  -p, --port        port (o) local IP port of the express server (0: dynamic)                       [default: '0']\n" +
			    "  -t, --timeout     milliseconds of inactivity before a server socket is presumed to have timed out [default: '120000']\n" +
			    "  -P, --pathname    URL pathname prefix (before /deploy and /build                                  [default: '/files']\n" +
			    "  -l, --level       debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error')               [default: 'http']\n" +
			    "  -h, --help        This message\n");
		process.exit(0);
	}
	console.log("opt:", opt);
	log.level = opt.level;

	new FsLocal({
		root: opt.root,
		pathname: opt.pathname,
		port: opt.port,
		timeout: opt.timeout,
		level: opt.level
	}, function(err, service){
		if (err) {
			process.exit(err);
		}
		// process.send() is only available if the
		// parent-process is also node
		if (process.send) {
			process.send(service);
		}
	});

} else {
	module.exports = FsLocal;
}
