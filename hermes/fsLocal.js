/**
 * fsLocal.js -- Ares FileSystem (fs) provider, using local files.
 * 
 * This FileSystemProvider is both the simplest possible one
 * and a working sample for other implementations.
 */

// check major version

var version = process.version.match(/[0-9]+.[0-9]+/)[0];
if (version <= 0.7) {
	console.error("Only supported on Node.js version 0.8 and above");
	process.exit(1);
}

// modules requirements

var fs = require("fs");
var path = require("path");
var express = require(path.resolve(__dirname, "node_modules/express"));
var util  = require('util');

// command-line arguments

var config = {
	// urlPrefix (M) can be '/', '/res/files/' ...etc
	urlPrefix:	process.argv[2],
	// root (m) local filesystem access root absolute path
	root:		path.resolve(process.argv[3]),
	// port (o) local IP port of the express server (default: 9009, 0: dynamic)
	port: parseInt(process.argv[4] || "9009", 10)
};

// express REST-ful framework configuration

var app = express.createServer();

//app.configure(function(){
	app.use(cors);
	app.use(express.logger('dev'));
	app.use(express.bodyParser()); // XXX useful?
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
		req.params.localPath = path.join(req.params.root, req.params.path);
		console.dir(req.params);

		if (verbs[req.params.verb]) {
			verbs[req.params.verb](req, res);
		} else {
			fail(res, "unknown verb="+req.params.verb);
		}
	});
	// error handler is the last one
	app.use(function(err, req, res, next){
		fail(res, err);
	});
//});

// start the filesuystem (fs) server & notify the IDE server (parent) where to find it

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

function success(res, data) {
	res.status(200).send(data);
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

// File-System (fs) verbs

var verbs = {
	get: function(req, res, next) {
		fs.stat(req.params.localPath, function(err, stat) {
			if (err) {
				return fail(res, err);
			}
			if (stat.isFile()) {
				fs.readFile(req.params.localPath, function(err, data) {
					if (err) {
						return fail(res, err);
					}
					return success(res, {content: data.toString()});
				});
			} else {
				return fail(res, "Not a file");
			}
		});
	},
	put: function (req, res, next) {
		fs.writeFile(req.params.localPath, req.param('content') || '', 'utf8', function(err){
			if (err) {
				return fail(res, err);
			} else {
				return success(res, {id: req.params.id, path: req.params.path});
			}
		});
	},
	createfile: function(req, res, next) {
		fs.stat(req.params.localPath, function(err, stats) {
			if (err && err.code === "ENOENT") {
				return verbs.put(req, res, next);
			} else {
				return fail(res, req.params.path + " already exists", 405 /*Method Not Allowed*/);
			}
		});
	},
	createfolder: function(req, res, next) {
		fs.mkdir(req.params.localPath, function(err) {
			if (!err) {
				return success(res, {id: req.params.id, path: req.params.path});
			} else if (err.code === 'EEXIST') {
				return fail(res, req.params.path + " already exists", 405 /*Method Not Allowed*/);
			} else {
				return fail(res, err);
			}
		});
	},
	deletefile: function(req, res, next) {
		fs.unlink(req.params.localPath, function(err){
			if (err) {
				return fail(res, err);
			} else {
				return success(res, {});
			}
		});
	},
	deletefolder: function(req, res, next) {
		rmrf(req.params.localPath, function(err) {
			if (err) {
				return fail(res, err);
			} else {
				return success(res, {});
			}
		});
	},
	rename: function(req, res, next) {
		var newPath = path.join(path.dirname(req.params.path), req.param('name'));
		fs.rename(req.params.localPath,
			  path.resolve(req.params.root, newPath),
			  function (err, data) {
				  if (err) {
					  return fail(res, err);
				  } else {
					  return success(res, {id: encodeFileId(newPath), path: newPath});
				  }
			  });
	},
	list: function(req, res, next) {
		fs.readdir(req.params.localPath, function(err, files) {
			if (err) {
				return fail(res, err);
			}
			if (!files.length) {
				return success(res, {contents:[]});
			}
			var count = files.length;
			var entries = [];
			files.forEach(function(name) {
				fs.stat(path.join(req.params.localPath, name), function(err, stats) {
					if (err) {
						// XXX or trim that specific entry & continue...
						return fail(res, err);
					}
					if (name.charAt(0) !==".") {
						var l = entries.push({
							id: encodeFileId(path.join(req.params.path, name)),
							path: path.join(req.params.path, name),
							name: name,
							isDir: stats.isDirectory()
						});
					}
					if (--count === 0) {
						return success(res, {contents: entries});
					}
				});
			});
		});
	}
};

function rmrf(dir, callback) {
	// https://gist.github.com/1526919
	fs.stat(dir, function(err, stats) {
		if (err) {
			return callback(err);
		}

		if (!stats.isDirectory()) {
			return fs.unlink(dir, callback);
		}

		var count = 0;
		fs.readdir(dir, function(err, files) {
			if (err) {
				return callback(err);
			}

			if (files.length < 1) {
				return fs.rmdir(dir, callback);
			}

			files.forEach(function(file) {
				var sub = path.join(dir, file);

				rmrf(sub, function(err) {
					if (err) {
						return callback(err);
					}

					if (++count == files.length) {
						fs.rmdir(dir, callback);
					}
				});
			});
		});
	});
}