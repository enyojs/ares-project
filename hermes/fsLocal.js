/**
 * fsLocal.js -- Ares FileSystem (fs) provider, using local files.
 * 
 * This FileSystemProvider is both the simplest possible one
 * and a working sample for other implementations.
 */

var fs = require("fs"),
    path = require("path"),
    util  = require("util"),
    mkdirp = require("mkdirp"),
    async = require("async"),
    FsBase = require(__dirname + "/lib/fsBase"),
    HttpError = require(__dirname + "/lib/httpError");

function FsLocal(inConfig, next) {
	inConfig.name = inConfig.name || "fsLocal";

	// inherits FsBase (step 1/2)
	FsBase.call(this, inConfig, next);
}

// inherits FsBase (step 2/2)
util.inherits(FsLocal, FsBase);

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

FsLocal.prototype.put = function(req, res, next) {
	this.log("put(): req.headers", req.headers);
	this.log("put(): req.body", req.body);

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

FsLocal.prototype.mkcol = function(req, res, next) {
	var newPath, newId,
	    pathParam = req.param('path'),
	    nameParam = req.param('name');
	if (!nameParam) {
		next(new HttpError("missing 'name' query parameter", 400 /*Bad-Request*/));
		return;
	}
	newPath = path.join(pathParam, path.basename(nameParam));
	newId = this.encodeFileId(newPath);

	fs.mkdir(path.join(this.root, newPath), function(err) {
		next(err, {
			code: 201, // Created
			body: {id: newId, path: newPath, isDir: true}
		});
	});
};

FsLocal.prototype['delete'] = function(req, res, next) {
	var pathParam = req.param('path'),
	    localPath = path.join(this.root, pathParam);
	if (localPath === this.root) {
		next(new HttpError("Not allowed to remove service root", 403 /*Forbidden*/));
	} else {
		this._rmrf(path.join(this.root, pathParam), function(err) {
			// return the new content of the parent folder
			this._propfind(err, path.dirname(pathParam), 1 /*depth*/, function(err, content) {
				next(err, {
					code: 200 /*Ok*/,
					body: content
				});
			});
		});
	}
};

FsLocal.prototype._propfind = function(err, relPath, depth, next) {
	if (err) {
		next(err);
		return;
	}

	var localPath = path.join(this.root, relPath);
	if (path.basename(relPath).charAt(0) ===".") {
		// Skip hidden files & folders (using UNIX
		// convention: XXX do it for Windows too)
		return next();
	}

	fs.stat(localPath, (function(err, stat) {
		if (err) {
			return next(err);
		}

		// minimum common set of properties
		var node = {
			path: relPath,
			name: path.basename(relPath),
			id: this.encodeFileId(relPath),
			isDir: stat.isDirectory()
		};

		this.log("depth="+depth+", node="+util.inspect(node));

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
	var localPath = path.join(this.root, req.param('path'));
	this.log("sending localPath=" + localPath);
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
FsLocal.prototype._putWebForm = function(req, res, next) {
	// Mutually-agreed encoding of file name & location:
	// 'path' and 'name'
	var relPath, fileId,
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
		this.log("putWebForm(): empty file");
		buf = '';
	}
	
	this.log("putWebForm(): storing file as", relPath);
	fileId = this.encodeFileId(relPath);
	fs.writeFile(path.join(this.root, relPath), buf, function(err){
		next(err, {
			code: 201, // Created
			body: [{id: fileId, path: relPath, isDir: false}]
		});
	});
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
FsLocal.prototype._putMultipart = function(req, res, next) {
	var pathParam = req.param('path'),
	    root = this.root,
	    encodeFileId = this.encodeFileId;
	this.log("putMultipart(): req.files=", util.inspect(req.files));
	this.log("putMultipart(): req.body=", util.inspect(req.body));
	this.log("putMultipart(): pathParam=",pathParam);
	if (!req.files.file) {
		next(new HttpError("No file found in the multipart request", 400 /*Bad Request*/));
		return;
	}
	var nodes = [], files = [];
	if (Array.isArray(req.files.file)) {
		files.concat(req.files.file);
	} else {
		files.push(req.files.file);
	}

	var filenames = [];
	if (req.body.filename) {
		if (Array.isArray(req.body.filename)) {
			filenames.concat(req.body.filename);
		} else {
			filenames.push(req.body.filename);
		}
		for (var i = 0; i < files.length; i++) {
			if (filenames[i]) {
				files[i].name = filenames[i];
			}
		}
	}
	async.forEach(files, (function(file, cb) {
		var relPath = path.join(pathParam, file.name),
		    absPath = path.join(root, relPath),
		    dir = path.dirname(absPath);

		this.log("putMultipart(): file.path=" + file.path + ", relPath=" + relPath + ", dir=" + dir);

		async.series([
			function(cb1) {
				mkdirp(dir, cb1);
			},
			function(cb1) {
				fs.rename(file.path, absPath, cb1);
			},
			function(cb1) {
				nodes.push({
					id: encodeFileId(relPath),
					path: relPath,
					isDir: false
				});
				cb1();
			}
		], cb);

	}).bind(this), function(err){
		next(err, {
			code: 201, // Created
			body: nodes
		});
	});
};

// XXX ENYO-1086: refactor tree walk-down
FsLocal.prototype._rmrf = function(localPath, next) {
	// from <https://gist.github.com/1526919>
	fs.stat(localPath, function(err, stats) {
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
	});
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
		var count = 0;
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
				if (files.length >= 1) {
					files.forEach(function(file) {
						var sub = path.join(dstPath, file);
						_copyNode(path.join(srcPath, file), path.join(dstPath, file), function(err) {
							if (err) {
								next(err);
								return;
							}
							if (++count == files.length) {
								next();
							}
						});
					});
				}
			});
		});
	}
};

module.exports = FsLocal;

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
		default: '9009'
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
		if (err) process.exit(err);
		// process.send() is only available if the
		// parent-process is also node
		if (process.send) process.send(service);
	});

}
