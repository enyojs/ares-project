/**
 * fsDropbox.js -- Ares FileSystem (fs) provider, using Dropbox
 */

var util  = require("util"),
    path = require("path"),
    request = require("request"),
    FsBase = require(__dirname + "/lib/fsBase"),
    HttpError = require(__dirname + "/lib/httpError");

function FsDropbox(inConfig, next) {
	inConfig.name = inConfig.name || "fsDropbox";

	// inherits FsBase (step 1/2)
	FsBase.call(this, inConfig, next);

	this.log("1/2");
	this.test();
}

// inherits FsBase (step 2/2)
util.inherits(FsDropbox, FsBase);

FsDropbox.prototype.test = function() {
	this.log("2/2");
}

FsDropbox.prototype.authorize = function(req, res, next) {
	this.log("FsDropbox.authorize(): req.cookies=", util.inspect(req.cookies));
	if (req.cookies.authorization) {
		var authorization = decodeURIComponent(req.cookies.authorization);
		this.log("FsDropbox.auth(): Cookie: authorization:", authorization);
		req.dropbox = {
			headers : {
				authorization: authorization
			}
		};
		next();
	} else if(req.query.authorization) {
		// will be dropped if not a POST request to '/'
		this.log("FsDropbox.authorize(): req.query=", util.inspect(req.query));
		next();
	} else {
		next(new HttpError('Missing Authorization cookie', 401));
	}
}

FsDropbox.prototype.setUserInfo = function(req, res, next) {
	this.log("FsDropbox.setUserInfo(): req.query=", util.inspect(req.query));
	this.log("FsDropbox.setUserInfo(): req.params=", util.inspect(req.params));
	var authorization = req.param('authorization');
	this.log("FsDropbox.setUserInfo(): authorization:", authorization);
	if (authorization) {
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + 10 /*days*/);

		var cookieOptions = {
			httpOnly: true,
			expires: exdate
			//maxAge: 1000*3600 // 1 hour
		};

		res.cookie('authorization', authorization, cookieOptions);
		this.log("FsDropbox.setUserInfo(): Set-Cookie: authorization:", authorization);
		res.send(200).end();
	} else {
		next(new HttpError('No User Info', 400 /*Bad Request*/));
	}
};

FsDropbox.prototype.getUserInfo = function(req, res, next) {
	this.log("FsDropbox.getUserInfo(): req.query:", req.query);
	req.dropbox.url = 'https://api.dropbox.com/1/account/info';
	request(req.dropbox, (function(err, response, body) {
		var statusCode = (response && response.statusCode) || 500;
		this.log("FsDropbox.getUserInfo(): err:", err, ", statusCode:", statusCode, ", body:", body);
		this.respond(res, err, {code: statusCode, body: body});
	}).bind(this));
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
	next (new HttpError("ENOSYS", 500));
};

FsDropbox.prototype['delete'] = function(req, res, next) {
	next (new HttpError("ENOSYS", 500));
};

// implementations

FsDropbox.prototype._propfind = function(err, req, relPath, depth, next) {
	req.dropbox.url = 'https://api.dropbox.com/1/metadata/sandbox/'+ relPath;
	if (depth) {
		req.dropbox.qs = {
			list: true,
			include_deleted: false
		};
	}
	this.log("_propfind(): req.dropbox=", req.dropbox);
	request(req.dropbox, (function(err, response, dbBody) {
		var arNode, dbNode, statusCode = (response && response.statusCode) || 500;
		this.log("_propfind(): err:", err, ", response:", statusCode, ", dbBody:", dbBody, "<<< Dropbox");
		try {
			if (!err && statusCode == 200) {
				dbNode = JSON.parse(dbBody);
				arNode = _wrapDbNode.bind(this)(dbNode, depth);
			}
		} catch(e) {
			err = e;
		}
		this.log("_propfind(): arNode:", arNode);
		next(err, {code: statusCode, body: arNode});
	}).bind(this));

	function _wrapDbNode(dbNode, depth) {
		this.log("wrapDbNode(): dbNode:", dbNode);
		var arNode;
		if (dbNode) {
			arNode = {
				isDir: dbNode.is_dir,
				path: dbNode.path,
				name: path.basename(dbNode.path),
				id: this.encodeFileId(dbNode.path)
			};
			if (dbNode.hash) {
				arNode.hash = dbNode.hash;
			}
			if (arNode.isDir) {
				arNode.children = [];
				if (depth) {
					dbNode.contents.forEach(function(dbNode){
						arNode.children.push(_wrapDbNode.bind(this)(dbNode, depth-1));
					}, this);
				}
			}
		}
		return arNode;
	}
};

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

}
