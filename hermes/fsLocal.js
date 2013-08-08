/* global require, console, process, module, __dirname, __filename */
/**
 * fsLocal.js -- Ares FileSystem (fs) provider, using local files.
 * 
 * This FileSystemProvider is both the simplest possible one
 * and a working sample for other implementations.
 */

// nodejs version checking is done in parent process ide.js

var fs = require("fs"),
    path = require("path"),
    util  = require("util"),
    mkdirp = require("mkdirp"),
    async = require("async"),
    FsBase = require(__dirname + "/lib/fsBase"),
    FdUtil = require(__dirname + "/lib/SimpleFormData"),
    CombinedStream = require('combined-stream'),
    HttpError = require(__dirname + "/lib/httpError");

var basename = path.basename(__filename, '.js');

function FsLocal(inConfig, next) {
	inConfig.name = inConfig.name || "fsLocal";

	// parameters sanitization
	this.root = path.resolve(this.root);

	// inherits FsBase (step 1/2)
	FsBase.call(this, inConfig, next);
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
	this.log("FsLocal.errorResponse(): err:", err);
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
		this.log(err.stack);
	}
	this.log("FsLocal.errorResponse(): response:", response);
	return response;
};

FsLocal.prototype.propfind = function(req, res, next) {
	// 'infinity' is '-1', 'undefined' is '0'
	var depthStr = req.param('depth');
	var depth = depthStr ? (depthStr === 'infinity' ? -1 : parseInt(depthStr, 10)) : 1;
	this._propfind(null, req.param('path'), depth, function(err, content){
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
	    nameParam = req.param('name');
	this.log("pathParam:", pathParam);
	this.log("nameParam:", nameParam);
	if (!nameParam) {
		next(new HttpError("missing 'name' query parameter", 400 /*Bad-Request*/));
		return;
	}
	newPath = path.relative('.', path.join('.', pathParam, nameParam));
	this.log("newPath:", newPath);
	if (newPath[0] === '.') {
		next(new HttpError("Attempt to navigate beyond the root folder: '" + newPath + "'", 403 /*Forbidden*/));
		return;
	}
	newPath = '/' + self.normalize(newPath);
	newName = path.basename(newPath);
	newId = this.encodeFileId(newPath);

	mkdirp(path.join(this.root, newPath), function(err) {
		next(err, {
			code: 201, // Created
			body: {
				id: newId,
				path: newPath,
				name: newName,
				isDir: true
			}
		});
	});
};

FsLocal.prototype['delete'] = function(req, res, next) {
	var pathParam = req.param('path'),
	    localPath = path.join(this.root, pathParam);
	if (localPath === this.root) {
		next(new HttpError("Not allowed to remove service root", 403 /*Forbidden*/));
	} else {
		this._rmrf(path.join(this.root, pathParam), (function(err) {
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
		next(err);
		return;
	}

	var localPath = path.join(this.root, relPath),
            urlPath = this.normalize(relPath);
	if (path.basename(relPath).charAt(0) ===".") {
		// Skip hidden files & folders (using UNIX
		// convention: XXX do it for Windows too)
		next();
		return;
	}

	fs.stat(localPath, (function(err, stat) {
		if (err) {
			return next(err);
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
			node.name = path.basename(this.root);
		}

		this.log("relPath=" + relPath + ", depth="+depth+", node="+util.inspect(node));

		if (stat.isFile() || !depth) {
			return next(null, node);
		} else if (node.isDir) {
			node.children = [];
			fs.readdir(localPath, (function(err, files) {
				if (err) {
					return next(err); // XXX or skip this directory...
				}
				if (!files.length) {
					return next(null, node);
				}
				var count = files.length;
				files.forEach(function(name) {
					this._propfind(null, path.join(relPath, name), depth-1, function(err, subNode){
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
				}, this);
			}).bind(this));
		} else {
			// skip special files
			return next();
		}
	}).bind(this));
};

FsLocal.prototype._getFile = function(req, res, next) {
	var relPath = req.param('path');
	var localPath = path.join(this.root, relPath);
	this.log("sending localPath=" + localPath);
	fs.stat(localPath, (function(err, stat) {
		if (err) {
			next(err);
			return;
		}
		if (stat.isFile()) {
			this._propfind(err, relPath, 0 /*depth*/, function(err, node) {
				res.setHeader('x-ares-node', JSON.stringify(node));
				res.status(200);
				res.sendfile(localPath);
				// return nothing: streaming response
				// is already in progress.
				next();
			});
		} else {
			if (stat.isDirectory() && req.param('format') === 'base64') {

				// Return the folder content as a FormData filled with base64 encoded file content

				var depthStr = req.param('depth');
				var depth = depthStr ? (depthStr === 'infinity' ? -1 : parseInt(depthStr, 10)) : 1;
				this.log("Preparing dir in base64, depth: " + depth + " " + localPath);
				this._propfind(null, req.param('path'), depth, function(err, content){

					// Build the multipart/formdata
					var combinedStream = CombinedStream.create();
					var boundary = FdUtil.generateBoundary();

					var addFiles = function(entries) {
						entries.forEach(function(entry) {
							if (entry.isDir) {
								addFiles(entry.children);
							} else {
								var filename = entry.path.substr(content.path.length + 1);
								var filepath = path.join(localPath, entry.path.substr(content.path.length));
								// console.log("adding file: ", filename);

								// Adding part header
								combinedStream.append(function(nextDataChunk) {
									nextDataChunk(FdUtil.getPartHeader(filename, boundary));
								});
								// Adding file data
								combinedStream.append(function(nextDataChunk) {
									fs.readFile(filepath, 'base64', function (err, data) {
										if (err) {
											next(new HttpError('Unable to read ' + filename, 500));
											nextDataChunk('INVALID CONTENT');
											return;
										}
										nextDataChunk(data);
									});
								});
								// Adding part footer
								combinedStream.append(function(nextDataChunk) {
									nextDataChunk(FdUtil.getPartFooter());
								});
							}
						});
					};

					addFiles(content.children);

					// Adding last footer
					combinedStream.append(function(nextDataChunk) {
						nextDataChunk(FdUtil.getLastPartFooter(boundary));
					});

					// Send the files back as a multipart/form-data
					res.status(200);
					res.header('Content-Type', FdUtil.getContentTypeHeader(boundary));
					res.header('X-Content-Type', FdUtil.getContentTypeHeader(boundary));
					combinedStream.pipe(res);
				});

			} else {
				next(new Error("not a file: '" + localPath + "'"));
			}
		}
	}).bind(this));
};

// XXX ENYO-1086: refactor tree walk-down
FsLocal.prototype._rmrf = function(localPath, next) {
	// from <https://gist.github.com/1526919>
	fs.stat(localPath, (function(err, stats) {
		if (err) {
			return next(err);
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
							return next(err);
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
	var absPath = path.join(this.root, file.name),
            urlPath = this.normalize(file.name),
	    dir = path.dirname(absPath),
	    encodeFileId = this.encodeFileId,
	    node;
	
	this.log("FsLocal.putFile(): file:", file, "-> absPath:", absPath);
	
	async.series([
		function(cb1) {
			mkdirp(dir, cb1);
		},
		function(cb1) {
			if (file.path) {
				fs.rename(file.path, absPath, cb1);
			} else if (file.buffer) {
				fs.writeFile(absPath, file.buffer, cb1);
			} else {
				cb1(new HttpError("cannot write file=" + JSON.stringify(file), 400));
			}
		},
		(function(cb1){
			this.log("FsLocal.putFile(): file length: ", 
				file.buffer && file.buffer.length);

			this.log("FsLocal.putFile(): file length: ", 
				file.path);
			
			node = {
				id: encodeFileId(urlPath),
				path: urlPath,
				name: path.basename(urlPath),
				isDir: false
			};
			cb1();
		}).bind(this)
	], (function(err) {
		this.log("FsLocal.putFile(): node:", node);
		next(err, node);
	}).bind(this));
};

// XXX ENYO-1086: refactor tree walk-down
FsLocal.prototype._changeNode = function(req, res, op, next) {
	var pathParam = req.param('path'),
	    nameParam = req.param('name'),
	    folderIdParam = req.param('folderId'),
	    overwriteParam = req.param('overwrite'),
	    srcPath = path.join(this.root, pathParam);
	var dstPath, dstRelPath;
	if (nameParam) {
		// rename/copy file within the same collection (folder)
		dstRelPath = path.join(path.dirname(pathParam),
				       path.basename(nameParam));
	} else if (folderIdParam) {
		// move/copy at a new location
		dstRelPath = path.join(this.decodeFileId(folderIdParam),
				       path.basename(pathParam));
	} else {
		next(new HttpError("missing query parameter: 'name' or 'folderId'", 400 /*Bad-Request*/));
		return;
	}
	dstPath = path.join(this.root, dstRelPath);
	if (srcPath === dstPath) {
		next(new HttpError("trying to move a resource onto itself", 400 /*Bad-Request*/));
		return;
	}
	fs.stat(dstPath, (function(err, stat) {
		// see RFC4918, section 9.9.4 (MOVE Status
		// Codes) & section 9.8.5 (COPY Status Codes).
		if (err) {
			if (err.code === 'ENOENT') {
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
			} else {
				next(err);
			}
		} else if (stat) {
			if (overwriteParam) {
				// Destination resource already exists : destroy it first
				this._rmrf(dstPath, (function(err) {
					op(srcPath, dstPath, (function(err) {
						//next(err, { code: 204 /*No-Content*/ });
						this._propfind(err, dstRelPath, 1 /*depth*/, function(err, content) {
							next(err, {
								code: 200 /*Ok*/,
								body: content
							});
						});
					}).bind(this));
				}).bind(this));
			} else {
				next(new HttpError('Destination already exists', 412 /*Precondition-Failed*/));
			}
		}
	}).bind(this));
};

// XXX ENYO-1086: refactor tree walk-down
FsLocal.prototype._cpr = function(srcPath, dstPath, next) {
	if (srcPath === dstPath) {
		return next(new HttpError("Cannot copy on itself", 400 /*Bad Request*/));
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
				_copyFile(srcPath, dstPath, next);
			}
		});
	}
	function _copyFile(srcPath, dstPath, next) {
		var is, os;
		is = fs.createReadStream(srcPath);
		os = fs.createWriteStream(dstPath);
		util.pump(is, os, next); // XXX should return 201 (Created) on success
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
		"pathname":	String,
		"level":	['silly', 'verbose', 'info', 'http', 'warn', 'error'],
		"help":		Boolean
	};
	var shortHands = {
		"r": "--root",
		"p": "--port",
		"P": "--pathname",
		"l": "--level",
		"v": "--level verbose",
		"h": "--help"
	};
	var argv = require('nopt')(knownOpts, shortHands, process.argv, 2 /*drop 'node' & basename*/);
	argv.pathname = argv.pathname || "/files";
	argv.port = argv.port || 0;
	argv.level = argv.level || "http";
	if (argv.help) {
		console.log("Usage: node " + basename + "\n" +
			    "  -p, --port        port (o) local IP port of the express server (0: dynamic)         [default: '0']\n" +
			    "  -P, --pathname    URL pathname prefix (before /deploy and /build                    [default: '/files']\n" +
			    "  -l, --level       debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error') [default: 'http']\n" +
			    "  -h, --help        This message\n");
		process.exit(0);
	}

	new FsLocal({
		root: argv.root,
		pathname: argv.pathname,
		port: argv.port,
		level: argv.level
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
