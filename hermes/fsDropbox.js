/**
 * fsDropbox.js -- Ares FileSystem (fs) provider, using Dropbox
 */

var util  = require("util"),
    path = require("path"),
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

FsDropbox.prototype.authorize = function(req, res, next) {
	var auth;
	if (req.cookies.dropbox_auth) {
		this.log("FsDropbox.authorize(): req.cookies=", util.inspect(req.cookies));
		_authorize(decodeURIComponent(req.cookies.dropbox_auth));
	} else if(req.query.auth) {
		this.log("FsDropbox.authorize(): req.query=", util.inspect(req.query));
		_authorize(req.query.auth);
	} else {
		next(new HttpError('Missing Authorization', 401));
	}

	function _authorize(authStr) {
		try {
			auth = JSON.parse(authStr);
			console.log("FsDropbox.authorize(): auth:" + util.inspect(auth));
		} catch(e) {
			return next(e);
		}
		req.dropbox = new dropbox.Client({
			key: auth.appKey, secret: auth.appSecret, sandbox: true
		});
		req.dropbox.authDriver(new _authDriver(auth));
		req.dropbox.authenticate(function(err, client) {
			if (err) {
				return next(err);
			}
			console.log("dropbox:" + util.inspect(client));
			next();
		});
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
			console.log("authDriver.onAuthStateChange(): client.authState:" + client.authState);
			client.setCredentials({
				uid: auth.uid,
				key: auth.appKey,
				secret: auth.appSecret,
				token: auth.accessToken,
				tokenSecret: auth.accessTokenSecret
			});
			console.log("authDriver.onAuthStateChange(): client.authState:" + client.authState);
			console.log("authDriver.onAuthStateChange(): client.oauth:" + util.inspect(client.oauth));
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
	next (new HttpError("ENOSYS", 500));
};

FsDropbox.prototype.copy = function(req, res, next) {
	next (new HttpError("ENOSYS", 500));
};

FsDropbox.prototype.get = function(req, res, next) {
	next (new HttpError("ENOSYS", 500));
};

FsDropbox.prototype.put = function(req, res, next) {
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

FsDropbox.prototype.mkcol = function(req, res, next) {
	var relPath = req.param('path') + req.param('name');
	this.log("mkcol(): relPath:", relPath);
	req.dropbox.mkdir(relPath, (function(err, stat) {
		this.log("mkcol(): dropbox err:", err, "stat:", stat);
		var node = getNode.bind(this)(stat, 0);
		this.log("mkcol(): node:", node);
		next(err, {code: 200, body: node});
	}).bind(this));
};

FsDropbox.prototype['delete'] = function(req, res, next) {
	next (new HttpError("ENOSYS", 500));
};

// implementations

FsDropbox.prototype._propfind = function(err, req, relPath, depth, next) {
	if (depth > 1) {
		return next(new HttpError("Unsupported depth=" + depth, 403));
	}

	req.dropbox.readdir("/" + relPath, _onReply.bind(this));

	function _onReply(err, entries, dirStat, entriesStat) {
		var node;
		this.log("_propfind(): err=", err, "entries:", entries, "dirStat:", dirStat, "entriesStat:", entriesStat);
		if (err) {
			next(err);
		} else {
			node = getNode.bind(this)({
				path: dirStat.path || '/',
				contents: entriesStat,
				isFolder: dirStat.isFolder
			}, depth);
			this.log("_propfind(): node:", node);
			next(null, {code: 200, body: node});
		}
	}

};

/**
 * Convert a Dropbox#Stat {Object} into an Ares#Node {Object}.
 */
function getNode(stat, depth) {
	this.log("getNode(): stat:", stat);
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
			arNode.hash = stat.versionTag;
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
	this.log("getNode(): arNode:", arNode);
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
	
	var version = process.version.match(/[0-9]+.[0-9]+/)[0];
	if (version <= 0.7) {
		process.exit("Only supported on Node.js version 0.8 and above");
	}

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
