/* global require, console, module */
var prototype, 
	path = require('path'), 
	fs = require('fs'), 
	util = require('util'), 
	rmDir = require('rimraf'), 
	HermesFiles = require('../lib/hermesFiles').HermesFiles, 
	_ = require('../lib/_'), 
	dl = path.join('/');

function HermesFilesystem(inConfig) {
	arguments.callee.super_.call(this, inConfig);
}

util.inherits(HermesFilesystem, HermesFiles);
prototype = Object.getPrototypeOf(HermesFilesystem.prototype);
HermesFilesystem.prototype.verbs = Object.create(prototype.verbs || {});

_.extend(true, HermesFilesystem.prototype, {
	name: "Filesystem Hermes Files Service", 
	parseConfig: function(inConfig) {
		var config;
		config = prototype.parseConfig.apply(this, arguments) || {};
		if (!config.root) {
			config.root = this.config.root;
		}
		return config;
	}, 
	execute: function(inVerb, req, res, next) {
		if (req.connection.remoteAddress !== "127.0.0.1") {
			console.error("Access denied from IP address "+req.connection.remoteAddress);
			res.send("Only local connections (from 127.0.0.1) are allowed", 403);
			return;
		}
		req.params.root = req.params.config.root;
		if (!_.endsWith(req.params.root, dl)) {
			req.params.root += dl;
		}
		req.params.fsPath = path.resolve(req.params.root, req.params.path);
		prototype.execute.apply(this, arguments);
	},
//
// ACTIONS
// 
	_get: function(inRoot, inPath, next) {
		var fsPath;

		if (arguments.length > 2) {
			fsPath = path.resolve(inRoot, inPath);
		} else {
			fsPath = inRoot;
			next = inPath;
			inRoot = inPath = null;
		}

		fs.stat(fsPath, function(err, stat) {
			if (err) {
				return next(err);
			}
			if (stat.isFile()) {
				fs.readFile(fsPath, function(err, data) {
					if (err) {
						return next(err);
					}
					next(null, {content: data.toString()});
				});
			} else {
				next(new Error("Not a file"));
			}
		});
	}, 
	_put: function(inRoot, inPath, inContent, next) {
		var fsPath = path.resolve(inRoot, inPath);

		fs.writeFile(fsPath, inContent, function(err) {
			if (err) {
				return next(err);
			}
			next(null, {id: inPath, path: inPath});
		});
	}, 
	_createfile: function(inRoot, inPath, inContent, next) {
		var fsPath;

		if (arguments.length > 3) {
			fsPath = path.resolve(inRoot, inPath);
		} else {
			fsPath = inRoot;
			next = inContent;
			inContent = inPath;
			inRoot = inPath = null;
		}

		fs.writeFile(fsPath, inContent || '', 'utf8', next);
	}, 
	_createfolder: function(inRoot, inPath, next) {
		var fsPath = path.resolve(inRoot, inPath);

		fs.mkdir(fsPath, 0755, function(err) {
			if (err) {
				return next(err);
			}
			next(null, {id: inPath, path: inPath});
		});
	}, 
	_deletefile: function(inRoot, inPath, next) {
		var fsPath;

		if (arguments.length > 2) {
			fsPath = path.resolve(inRoot, inPath);
		} else {
			fsPath = inRoot;
			next = inPath;
			inRoot = inPath = null;
		}
		fs.unlink(fsPath, next);
	}, 
	_deletefolder: function(inRoot, inPath, next) {
		var fsPath;

		if (arguments.length > 2) {
			fsPath = path.resolve(inRoot, inPath);
		} else {
			fsPath = inRoot;
			next = inPath;
			inRoot = inPath = null;
		}

		rmDir(fsPath, {gently: fsPath}, function() {
			next.apply(null, arguments);
		});
	}, 
	_rename: function(inRoot, inPath, inName, next) {
		var fsPath = path.resolve(inRoot, inPath),
			id = path.dirname(inPath) + '/' + inName;
			
		fs.rename(fsPath, path.resolve(inRoot, id), function (err, data) {
			if (err) {
				return next(err);
			}
			next(null, {id: id, path: id});
		});
	},
	_list: function(inRoot, inPath, next) {
		var fsPath = path.resolve(inRoot, inPath);

		inPath = _.rtrim(inPath, dl);
		
		console.log('HermesFilesystem, _list', fsPath);
	
		fs.readdir(fsPath, function(err, files) {
			if (err) {
				return next(err);
			}
			if (!files.length) {
				return next(null, {contents:[]});
			}
			
			var count = files.length,
			    entries = [];
			
			files.forEach(function(name) {
				fs.stat(path.join(fsPath, name), function(err, stats) {
					if (err) {
						return next(err);
					}
					if (name.charAt(0) !==".") {
						entries.push({
							id: inPath + '/' + name,
							path: inPath + '/' + name,
							name: name,
							isDir: stats.isDirectory()
						});
					}
					if (--count === 0) {
						var ret = {
							contents: entries
						};
						
						console.log('HermesFilesystem, _list results', ret);
						next(null, ret);
					}
				});
			});
		});
	}, 
	verbs: {
		get: function(req, res, next) {
			this._get(req.params.fsPath, next);
		},
		put: function(req, res, next) {
			this._put(req.params.root, req.params.path, req.param('content'), next);
		},
		createFile: function(req, res, next) {
			this._createfile(req.params.fsPath, req.param('content'), next);
		},
		createFolder: function(req, res, next) {
			this._createfolder(req.params.root, req.params.path, next);
		},
		deleteFile: function(req, res, next) {
			this._deletefile(req.params.fsPath, next);
		},
		deleteFolder: function(req, res, next) {
			this._deletefolder(req.params.fsPath, next);
		},
		rename: function(req, res, next) {
			this._rename(req.params.root, req.params.path, req.param('name'), next);
		},
		list: function(req, res, next) {
			this._list(req.params.root, req.params.path, next);
		}
	}
});

module.exports = {
	HermesFilesystem: HermesFilesystem
};