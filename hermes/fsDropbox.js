/**
 * fsDropbox.js -- Ares FileSystem (fs) provider, using Dropbox
 */

require('./lib/checkNodeVersion');		// Check nodejs version

var util  = require("util"),
    path = require("path"),
    fs = require("fs"),
    http = require("http"),
    https = require("https"),
    dropbox = require("dropbox"),
    request = require("request"),
    FsBase = require(__dirname + "/lib/fsBase"),
    HttpError = require(__dirname + "/lib/httpError");

function FsDropbox(inConfig, next) {
	inConfig.name = inConfig.name || "fsDropbox";

	// inherits FsBase (step 1/2)
	FsBase.call(this, inConfig, next);
}

// inherits FsBase (step 2/2)
util.inherits(FsDropbox, FsBase);

FsDropbox.prototype.configure = function(config, next) {
	this.log("FsDropbox.configure(): config:", config);
	this.parseProxy(config);
	if (this.httpAgent) {
		dropbox.Xhr.Request.nodejsSet({httpAgent: this.httpAgent});
	}
	if (this.httpsAgent) {
		dropbox.Xhr.Request.nodejsSet({httpsAgent: this.httpsAgent});
	}
	if (next) next();
};

FsDropbox.prototype.errorResponse = function(err) {
	this.log("FsDropbox.errorResponse(): err:", err);
	var response;
	if (err instanceof dropbox.ApiError) {
		response = {
			code: err.status,
			body: err.response
		};
		this.log(err.stack);
	} else {
		response = FsBase.prototype.errorResponse.bind(this)(err);
	}
	this.log("FsDropbox.errorResponse(): response:", response);
	return response;
};

FsDropbox.prototype.authorize = function(req, res, next) {
	var auth;
	if (req.cookies.dropbox_auth) {
		this.log("FsDropbox.authorize(): req.cookies=", util.inspect(req.cookies));
		_authorize.bind(this)(decodeURIComponent(req.cookies.dropbox_auth));
	} else if(req.query.auth) {
		this.log("FsDropbox.authorize(): req.query=", util.inspect(req.query));
		_authorize.bind(this)(req.query.auth);
	} else {
		next(new HttpError('Missing Authorization', 401));
	}

	function _authorize(authStr) {
		try {
			auth = JSON.parse(authStr);
			this.log("FsDropbox.authorize(): auth:" + util.inspect(auth));
		} catch(e) {
			return next(e);
		}
		req.dropbox = new dropbox.Client({
			key: auth.appKey, secret: auth.appSecret, sandbox: true
		});
		req.dropbox.authDriver(new _authDriver(auth));
		req.dropbox.authenticate((function(err, client) {
			if (err) {
				return next(err);
			}
			this.log("dropbox:" + util.inspect(client));
			next();
		}).bind(this));
	}

	// see https://github.com/dropbox/dropbox-js/blob/master/doc/auth_drivers.md
	function _authDriver(auth) {
		if (!auth || !auth.uid ||
		    !auth.appKey || !auth.appSecret ||
		    !auth.accessToken || !auth.accessTokenSecret) {
			throw new HttpError("Missing OAuth authorization parameters", 400);
		} 
		this.url = function() { return ""; };
		this.doAuthorize = function(authUrl, token, tokenSecret, callback) {
			console.log("authDriver.doAuthorize(): authUrl:"+ authUrl + " , token:" + token + ", tokenSecret:", tokenSecret);
			callback();
		};
		this.onAuthStateChange = function(client, callback) {
			//console.log("authDriver.onAuthStateChange(): client.authState:" + client.authState);
			client.setCredentials({
				uid: auth.uid,
				key: auth.appKey,
				secret: auth.appSecret,
				token: auth.accessToken,
				tokenSecret: auth.accessTokenSecret
			});
			//console.log("authDriver.onAuthStateChange(): client.authState:" + client.authState);
			//console.log("authDriver.onAuthStateChange(): client.oauth:" + util.inspect(client.oauth));
			callback();
		};
	}
};

FsDropbox.prototype.setUserInfo = function(req, res, next) {
	this.log("FsDropbox.setUserInfo(): req.query=", util.inspect(req.query));
	this.log("FsDropbox.setUserInfo(): req.params=", util.inspect(req.params));
	var auth = req.param('auth');
	this.log("FsDropbox.setUserInfo(): auth:", auth);
	if (auth) {
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + 10 /*days*/);

		var cookieOptions = {
			httpOnly: true,
			expires: exdate
			//maxAge: 1000*3600 // 1 hour
		};

		res.cookie('dropbox_auth', auth, cookieOptions);
		this.log("FsDropbox.setUserInfo(): Set-Cookie: dropbox_auth:", auth);
		res.send(200).end();
	} else {
		next(new HttpError('No User Info', 400 /*Bad Request*/));
	}
};

FsDropbox.prototype.getUserInfo = function(req, res, next) {
	this.log("FsDropbox.getUserInfo(): req.query:", req.query);
	req.dropbox.getUserInfo(function(err, userInfo) {
		console.log("getUserInfo(): err=" + util.inspect(err), ", userInfo=" + util.inspect(userInfo));
		if (err) {
			next(err);
		} else {
			res.status(200).send(userInfo);
		}
	});
};

FsDropbox.prototype.propfind = function(req, res, next) {
	// 'infinity' is '-1', 'undefined' is '0'
	var depthStr = req.param('depth');
	var depth = depthStr ? (depthStr === 'infinity' ? -1 : parseInt(depthStr, 10)) : 1;
	this._propfind(null, req, req.param('path'), depth, this.respond.bind(this, res));
};

FsDropbox.prototype.move = function(req, res, next) {
	this.log("FsDropbox.move()");
	this.copyOrMove(req, res, req.dropbox.move.bind(req.dropbox), next);
};

FsDropbox.prototype.copy = function(req, res, next) {
	this.log("FsDropbox.copy()");
	this.copyOrMove(req, res, req.dropbox.copy.bind(req.dropbox), next);
};

FsDropbox.prototype.copyOrMove = function(req, res, op, next) {
	var srcRelPath = req.param('path'),
	    dstName = req.param('name'),
	    dstFolderId = req.param('folderId'),
	    overwriteParam = req.param('overwrite');
	var dstRelPath;
	this.log("FsDropbox.copyOrMove(): path:", srcRelPath, "name:", dstName, "folderId:", dstFolderId);
	if (dstName) {
		// rename/copy file within the same collection (folder)
		dstRelPath = path.join(path.dirname(srcRelPath),
				       path.basename(dstName));
	} else if (dstFolderId) {
		// move/copy at a new location
		dstRelPath = path.join(this.decodeFileId(dstFolderId),
				       path.basename(srcRelPath));
	} else {
		next(new HttpError("missing query parameter: 'name' or 'folderId'", 400 /*Bad-Request*/));
		return;
	}
	this.log("FsDropbox.copyOrMove():", srcRelPath, "-> ", dstRelPath);
	op(srcRelPath, dstRelPath, (function(err, stat) {
		this.log("FsDropbox.copyOrMove(): dropbox err:", err, "stat:", stat);
		var node = getNode.bind(this)(stat, 0);
		this.log("FsDropbox.copyOrMove(): node:", node);
		next(err, {
			code: 200,
			body: node
		});
	}).bind(this));
};

FsDropbox.prototype.get = function(req, res, next) {
	var relPath = req.param('path');
	this.log("FsDropbox.get(): path:", relPath);
	var options = {
		versionTag: req.param('versionTag'),
		arrayBuffer: false, // request 'arraybuffer'
		blob: false,	    // request 'blob'
		binary: true,	    // request 'b'
		length: undefined,   // chunked request
		start: undefined     // chunked request
	};
	req.dropbox.readFile(relPath, options, (function(err, data, stat) {
		this.log("FsDropbox.get(): dropbox err:", err, "stat:", stat);
		var node = getNode.bind(this)(stat, 0);
		this.log("FsDropbox.get(): node:", node);
		next(err, {
			code: 200,
			body: data,
			headers: {
				'x-ares-node': JSON.stringify(node)
			}
		});
	}).bind(this));
};

FsDropbox.prototype.putFile = function(req, file, next) {
	this.log("FsDropbox.putFile(): file.name:", file.name);
	var options = {
		noOverwrite: false,
		lastVersionTag: undefined
	};
	var buf = file.buffer;
	if (file.path) {
		this.log("FsDropbox.putFile(): uploading file:", file.path);
		// Dropbox has no Node.js streaming interface, so we
		// need to load the entire file in memory.
		fs.readFile(file.path, _writeFile.bind(this));
	} else {
		_writeFile.bind(this)(file.buffer);
	}

	function _writeFile(err, buffer) {
		if (err) {
			return next(err);
		}
		this.log("FsDropbox.putFile(): bytes:", buffer.length, "->", file.name);
		req.dropbox.writeFile(file.name, buffer, options, (function(err, stat) {
			this.log("FsDropbox.putFile.writeFile(): dropbox err:", err, "stat:", stat);
			var node = getNode.bind(this)(stat, 0);
			this.log("FsDropbox.putFile.writeFile(): node:", node);
			next(err, node);
		}).bind(this));
	}
};

FsDropbox.prototype.mkcol = function(req, res, next) {
	var relPath = req.param('path') + '/' + req.param('name');
	this.log("FsDropbox.mkcol(): relPath:", relPath);
	req.dropbox.mkdir(relPath, (function(err, stat) {
		this.log("FsDropbox.mkcol(): dropbox err:", err, "stat:", stat);
		var node = getNode.bind(this)(stat, 0);
		this.log("FsDropbox.mkcol(): node:", node);
		next(err, {code: 201, body: node});
	}).bind(this));
};

FsDropbox.prototype['delete'] = function(req, res, next) {
	var relPath = req.param('path');
	this.log("FsDropbox.delete(): path:", relPath);
	req.dropbox.remove(relPath, (function(err, stat) {
		this.log("FsDropbox.delete(): dropbox err:", err, "stat:", stat);
		var node = getNode.bind(this)(stat, 0);
		this.log("FsDropbox.delete(): node:", node);
		next(err, {
			code: 200,
			body: node
		});
	}).bind(this));
};

// implementations

FsDropbox.prototype._propfind = function(err, req, relPath, depth, next) {
	this.log("FsDropbox._propfind(): err=", err, "relPath:", relPath, "depth:", depth);
	if (depth > 1) {
		return next(new HttpError("Unsupported depth=" + depth, 403));
	}

	req.dropbox.readdir("/" + relPath, _onReply.bind(this));

	function _onReply(err, entries, dirStat, entriesStat) {
		var node;
		this.log("FsDropbox._propfind.onReply(): err=", err, "entries:", entries, "dirStat:", dirStat, "entriesStat:", entriesStat);
		if (err) {
			next(err);
		} else {
			node = getNode.bind(this)({
				path: dirStat.path || '/',
				contents: entriesStat,
				isFolder: dirStat.isFolder
			}, depth);
			this.log("FsDropbox._propfind.onReply(): node:", node);
			next(null, {code: 200, body: node});
		}
	}

};

/**
 * Convert a Dropbox#Stat {Object} into an Ares#Node {Object}.
 */
function getNode(stat, depth) {
	this.log("FsDropbox.getNode(): stat:", stat);
	var arNode;
	if (stat) {
		arNode = {
			isDir: stat.isFolder,
			path: stat.path,
			name: path.basename(stat.path),
			id: this.encodeFileId(stat.path)
		};
		if (arNode.name === '') {
			// XXX replace by the Dropbox application folder name?
			arNode.name = 'dropbox';
		}
		if (stat.versionTag) {
			arNode.versionTag = stat.versionTag;
		}
		if (arNode.isDir) {
			if (depth) {
				arNode.children = [];
				stat.contents.forEach(function(stat){
					arNode.children.push(getNode.bind(this)(stat, depth-1));
				}, this);
			}
		}
	}
	this.log("FsDropbox.getNode(): arNode:", arNode);
	return arNode;
}

// module/main wrapper

if (path.basename(process.argv[1]) === "fsDropbox.js") {
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
		default: '9010'
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

	var fsDropbox = new FsDropbox({
		pathname: argv.pathname,
		port: argv.port,
		verbose: argv.verbose
	}, function(err, service){
		if (err) process.exit(err);
		// process.send() is only available if the
		// parent-process is also node
		if (process.send) process.send(service);
	});

} else {
	module.exports = FsDropbox;
}
