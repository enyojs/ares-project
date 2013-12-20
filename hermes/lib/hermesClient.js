/* global require, console, process, module  */
var	Stream = require('stream').Stream, 
	express = require('express'), 
	_ = require('./_'), 
	step = require('stepup'), 
	debug = require('./debug');

function cors(req, res, next) {
	// TODO: override this in individual services?
	res.header('Access-Control-Allow-Origin', "*");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	//
	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.send(200);
	} else {
		next();
	}
}

function HermesClient(inConfig) {
	var server, self;
	self = this;

	this.config = _.mask(inConfig, this._configMask);
	_.extend(this, _.mask(this.config, this._propertyMask));

	if (this.config.certs) {
		server = express.createServer(this.config.certs);
	} else {
		server = express.createServer();
	}
	this.server = server;
	
	// Not sure if this is overridable, but it should be
	server.configure(function() {
		if (self.debug) {
			self.debug = debug(self.onError ? self.onError : HermesClient.prototype.onError);
			server.use(self.debug);
		}
		server.use(cors);
		server.use(express.bodyParser());
		server.use(express.cookieParser());
		server.enable('strict routing');
		server.set('jsonp callback', true);
	});

	for (var verb in this.routes) {
		server.all(verb,  this.routes[verb].bind(this, verb));
	}
	server.listen(this.port, "127.0.0.1", null /*backlog*/, function() {
		var msg = {
			url: "http" + (self.config.certs ? "s" : "") + "://127.0.0.1:"+server.address().port.toString()
		};
		console.log(JSON.stringify(msg));
		if (process.send) {
			process.send(msg);
		}
	});
}

HermesClient.prototype = {
	_configMask: ['port', 'debug', 'name', 'certs', 'root'],
	_propertyMask: ['port', 'debug', 'name'],
	port: 9000,
	debug: true,
	name: 'Hermes Service',
	onError: function(req, res, err, next) {
		console.log('============================ ERROR ============================');
		if (err instanceof Error) {
			console.log(err.stack);
			res.writeHead(500);
			res.end(err.stack);
		} else {
			res.writeHead(403);
			res.end(JSON.stringify({error: err}));
		}
	}, 
	routes: {
		'/:verb/*': function(route, req, res) {
			console.log("\n============================ " + this.name + " ============================");
			console.log("= url:", req.url);
			console.log("= verb:", req.params.verb);
			console.log("= cookie:", req.cookies.provider);
			console.log("==============");
			this.verb(req.params.verb, req, res);
		}
	}, 
	verb: function(inVerb, req, res) {
		var self;

		self = this;

		step(_.bind(this.onError, this, req, res), 
			function() {
				if (!self.hasVerb(inVerb)) {
					self.onError(req, res, 'Verb not supported: '+inVerb);
					return;
				}

				req.params.config = self.parseConfig(req.cookies.provider);
				console.log('Config:\n', req.cookies, '\n', req.params.config);

				if (!req.params.config) {
					return self.onError(req, res, 'Insufficient credentials provided.');
				}

				self.execute(inVerb, req, res, this);
			}, 
			function(data) {
				console.log("= verb [" + inVerb + "] complete");
				self.send(res, data);
			}
		);
	}, 
	execute: function(inVerb, req, res, next) {
		this.verbs[inVerb].call(this, req, res, next);
	}, 
	send: function(res, inData) {
		if (inData instanceof Stream) {
			console.log('Streaming response...');
			inData.pipe(res);
		} else {
			res.send(inData);
		}
	}, 
	hasVerb: function(inVerb) {
		if (!this.verbs[inVerb] || Object.prototype[inVerb]) {
			console.log("unknown verb [" + inVerb + "]");
			return false;
		} else {
			return true;
		}
	}, 
	parseConfig: function(inConfig) {
		var config;

		if (!inConfig) {
			console.log("provider config was empty");
			return {};
		}

		try {
			config = JSON.parse(inConfig).params;
		} catch(e) {
			throw new Error("Invalid JSON in provider config");
		}

		console.log("provider config:", config);
		return config;
	}
};

module.exports = {
	HermesClient: HermesClient
};




