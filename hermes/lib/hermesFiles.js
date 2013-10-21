/* global require, __filename, console, module, ZipRequestStream  */
var prototype, 
	util = require('util'), 
	path = require('path'), 
	fs = require('fs'), 
	step = require('stepup'), 
	_ = require('./_'), 
	HermesClient = require('./hermesClient').HermesClient, 
	cache = require('./connectionCache');

function HermesFiles(inConfig) {
	arguments.callee.super_.call(this, inConfig);

	if (this.cache) {
		this.cache = cache;
	}
}

util.inherits(HermesFiles, HermesClient);
prototype = Object.getPrototypeOf(HermesFiles.prototype);
HermesFiles.prototype.verbs = Object.create(prototype.verbs || {});

_.extend(true, HermesFiles.prototype, {
	name: "Hermes Files Service", 
	execute: function(inVerb, req, res, next) {
		var self;
		self = this;

		console.log('HermesFiles, execute: ', inVerb);
		step(
			function(err) {
				try {
					next(err);
				} catch(e) {
					res.send(500, err);
				}
				//HermesClient.prototype.onError(req, res, err, next); FIXME should work...
			}, 
			function() {
				var connection;

				if (req.params.config) {
					if (self.cache) {
							// locate a cached connection, if any
							// connection = self.cache.extract(key)
					} 

					if (connection) {
						this(null, connection);
					} else if (self.connect) {
						self.connect(req.params.config, this);
					} else {
						this();
					}
				}
			}, 
			function(connection) {
				req.connection = connection;
				self.verbs[inVerb].call(self, req, res, this);
			}, 
			function(data) {
				next(null, data);

				if (self.cache) {
					// cache this ftp instance for temporary reuse
					// self.cache.set(key, ftp)
				}
			}
		);
	}, 
	routes: {
		'/': function(route, req, res) {
			console.log("Route /");
			res.send("<b>Hermes server running, use Ares to connect.</b>");
		},		
		'/:verb/*': function(route, req, res) {
			console.log('HermesFiles, route: ', route);
			// strip leading slash from path
			req.params.path = _.ltrim(req.params[0], '/');

			prototype.routes[route].apply(this, arguments);
		}
	}, 
	verbs: {
		// getFolder depends on zipRequestStream, which isn't included yet. We'll get to that 
		// when Phonegap Build support goes in.
		getFolder: function(req, res, next) {
			var zipRequestStream, 
				self = this,
				outPath =  path.join(path.dirname(__filename), 'out' + Date.now() + '.zip');

			console.log('getFolder: ', req.params.fsPath, ', ', req.params.path);

			/*
			if (typeof uri.cookie !== 'string' && !!uri.cookie) {
				uri.cookie = Object.keys(uri.cookie).map(function(v) {
					return v+'="'+encodeURIComponent(JSON.stringify(uri.cookie[v]))+'"'
				}).join(';')
			}
			*/

			zipRequestStream = new ZipRequestStream(function get(inPath, next) {
					console.log('HermesFiles, get: ', path.resolve(req.params.root, inPath));
					self._get(path.resolve(req.params.root, inPath), next);
				}, 
				function list(inPath, next) {
					console.log('HermesFiles, list: ', path.resolve(req.params.root, inPath));
					self._list(req.params.root, inPath, next);
				}
			)(req.params.fsPath);

			// Since phonegap requires multipart/form-data, which requires Content-length
			// We must pipe to fs first (or memory) and then pipe out
			// Does content-length get set when piping to res?
			zipRequestStream.pipe(fs.createWriteStream(outPath));
			zipRequestStream.on('end', function() {
				fs.stat(outPath, function(err, stat) {
					if (err) {
						return next(err);
					}

					var rs = fs.createReadStream(outPath);
					res.setHeader('Content-length', stat.size);
					rs.pipe(res);
					rs.on('end', fs.unlink.bind(fs, outPath));
				});
			});
			zipRequestStream.on('error', next);
		}
	}
});

module.exports = {
	HermesFiles: HermesFiles
};
