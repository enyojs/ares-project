/* global require, console, process, module, __filename */
/**
 * Project Generator based on ZIP-files
 */

// nodejs version checking is done in parent process ide.js

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    createDomain = require('domain').create,
    log = require('npmlog'),
    temp = require("temp"),
    http = require("http"),
    rimraf = require("rimraf"),
    ptools = require("ares-generator"),
    CombinedStream = require('combined-stream');

var basename = path.basename(__filename, '.js');
log.heading = basename;
log.level = 'http';

var FORM_DATA_LINE_BREAK = '\r\n';
var performCleanup = true;

function GenZip(config, next) {
	var self = this;
	this.config = config;
	log.info('GenZip', "config:", this.config);

	// express-3.x
	var app, server;
	app = express();
	server = http.createServer(app);

	/*
	 * Middleware -- applied to every verbs
	 */
	if (!this.quiet) {
		app.use(express.logger('dev'));
	}

	/*
	 * Error Handling - Wrap exceptions in delayed handlers
	 */
	app.use(function(req, res, next) {
		var domain = createDomain();

		domain.on('error', function(err) {
			next(err);
			domain.dispose();
		});

		domain.enter();
		next();
	});

	/**
	 * Make sane Express matching paths
	 * @private
	 */
	function makeExpressRoute(path) {
		return (config.pathname + path)
			.replace(/\/+/g, "/") // compact "//" into "/"
			.replace(/(\.\.)+/g, ""); // remove ".."
	}

	// CORS -- Cross-Origin Resources Sharing
	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', "*"); // XXX be safer than '*'
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
		if ('OPTIONS' == req.method) {
			res.status(200).end();
		}
		else {
			next();
		}
	});

	// Authentication
	app.use(function(req, res, next) {
		if (req.connection.remoteAddress !== "127.0.0.1") {
			next(new Error("Access denied from IP address "+req.connection.remoteAddress));
		} else {
			next();
		}
	});

	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.<field>[], req.body.file[]
	this.uploadDir = temp.path({prefix: 'com.palm.ares.hermes.genZip'}) + '.d';
	fs.mkdirSync(this.uploadDir);
	app.use(express.bodyParser({keepExtensions: true, uploadDir: this.uploadDir}));

	/*
	 * Verbs
	 */

	app.post(makeExpressRoute('/op/generate'), generate.bind(this));

	app.post('/config', (function(req, res, next) {
		log.verbose("req.body:", req.body);
		var config = req.body && req.body.config;
		this.config = util._extend(this.config, config);
		this.configure(this.config, function(err) {
			res.status(200).end();
		});
	}).bind(this));

	app.get(makeExpressRoute('/config/sources'), getSources.bind(this));

	/*
	 * Error handling, in last position, to be used by both
	 * middleware & verbs
	 */

	function errorHandler(err, req, res, next){
		log.error("errorHandler(): ", err.stack);
		res.status(err.statusCode || 500);
		res.contentType('txt'); // direct usage of 'text/plain' does not work
		res.send(err.toString());
	}
	
	// express-3.x: middleware with arity === 4 is detected as the
	// error handler (.)
	app.use(errorHandler);

	/*
	 * HTTP server
	 */

	// Send back the service location information (origin,
	// protocol, host, port, pathname) to the creator, when port
	// is bound
	server.listen(config.port, "127.0.0.1", null /*backlog*/, function() {
		var port = server.address().port;
		return next(null, {
			protocol: 'http',
			host: '127.0.0.1',
			port: port,
			origin: "http://127.0.0.1:"+ port,
			pathname: config.pathname
		});
	});

	/*
	 * Methods
	 */

	function getSources(req, res, next) {
		log.info("getSources()");
		self.tools.getSources(req.query.type, function(err, sources) {
			if (err) {
				next(err);
			} else {
				log.info("getSources()", "sources:", sources);
				res.status(200).send(sources).end();
			}
		});
	}

	function generate(req, res, next) {
		log.info("generate()");

		var destination = temp.mkdirSync({prefix: 'com.enyojs.ares.services.genZip'});
		self.tools.generate(JSON.parse(req.body.sourceIds), JSON.parse(req.body.substitutions), destination, {
			overwrite: req.param("overwrite")
		}, function(inError, inData) {
			if (inError) {
				next(inError);
				return;
			}

			// Build the multipart/formdata
			var combinedStream = CombinedStream.create();
			var boundary = generateBoundary();
			inData.forEach(function(file) {
				if (fs.statSync(file).isFile()) {
					var filename = file.substr(destination.length + 1);
					var filepath = file;
					// Adding part header
					combinedStream.append(function(nextDataChunk) {
						nextDataChunk(getPartHeader(filename, boundary));
					});
					// Adding file data
					combinedStream.append(function(nextDataChunk) {
						fs.readFile(filepath, 'base64', function (err, data) {
							if (err) {
								next(err);
								nextDataChunk('INVALID CONTENT');
								return;
							}
							nextDataChunk(data);
						});
					});
					// Adding part footer
					combinedStream.append(function(nextDataChunk) {
						nextDataChunk(getPartFooter());
					});
				}
			});

			// Adding last footer
			combinedStream.append(function(nextDataChunk) {
				nextDataChunk(getLastPartFooter(boundary));
			});

			// Send the files back as a multipart/form-data
			res.status(200);
			res.header('Content-Type', getContentTypeHeader(boundary));
			res.header('X-Content-Type', getContentTypeHeader(boundary));
			combinedStream.pipe(res);

			// cleanup the temp dir when the response has been sent
			combinedStream.on('end', function() {
				if (performCleanup) {
					log.verbose("cleanup", "starting removal of " + destination);
					rimraf(destination, function(err) {
						log.verbose("cleanup", "removed " + destination);
					});
				} else {
					log.verbose("cleanup", "skipping removal of " + destination);
				}
			});
		});
	}

	function generateBoundary() {
		// This generates a 50 character boundary similar to those used by Firefox.
		// They are optimized for boyer-moore parsing.
		var boundary = '--------------------------';
		for (var i = 0; i < 24; i++) {
			boundary += Math.floor(Math.random() * 10).toString(16);
		}

		return boundary;
	}

	function getContentTypeHeader(boundary) {
		return 'multipart/form-data; boundary=' + boundary;
	}

	function getPartHeader(filename, boundary) {
		var header = '--' + boundary + FORM_DATA_LINE_BREAK;
		header += 'Content-Disposition: form-data; name="file"';

		header += '; filename="' + filename + '"' + FORM_DATA_LINE_BREAK;
		header += 'Content-Type: application/octet-stream; x-encoding=base64';

		header += FORM_DATA_LINE_BREAK + FORM_DATA_LINE_BREAK;
		return header;
	}

	function getPartFooter() {				// TODO: Switch to SimpleFormData
		return FORM_DATA_LINE_BREAK;
	}

	function getLastPartFooter(boundary) {
		return '--' + boundary + '--';
	}
}

GenZip.prototype.configure = function(config, next) {
	this.tools = new ptools.Generator(config, next);
};

GenZip.prototype.onExit = function() {
	var directory = this.uploadDir;
	rimraf(directory, function(err) {
		// Nothing to do
	});
};

// Main
if (path.basename(process.argv[1], '.js') === basename) {
	// We are main.js: create & run the object...

	var knownOpts = {
		"port":		Number,
		"pathname":	String,
		"level":	['silly', 'verbose', 'info', 'http', 'warn', 'error'],
		"help":		Boolean
	};
	var shortHands = {
		"p": "port",
		"P": "pathname",
		"l": "--level",
		"v": "--level verbose",
		"h": "help"
	};
	var argv = require('nopt')(knownOpts, shortHands, process.argv, 2 /*drop 'node' & basename*/);
	argv.pathname = argv.pathname || "/genZip";
	argv.port = argv.port || 0;
	argv.level = argv.level || "http";
	if (argv.help) {
		console.log("Usage: node " + basename + "\n" +
			    "  -p, --port        port (o) local IP port of the express server (0: dynamic)         [default: '0']\n" +
			    "  -P, --pathname    URL pathname prefix (before /deploy and /build                    [default: '/genZip']\n" +
			    "  -l, --level       debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error') [default: 'http']\n" +
			    "  -h, --help        This message\n");
		process.exit(0);
	}

	log.level = argv.level || 'http';

	new GenZip({
		pathname: argv.pathname,
		port: argv.port,
		level: argv.level
	}, function(err, service){
		if(err) {
			process.exit(err);
		}
		// process.send() is only available if the
		// parent-process is also node
		if (process.send) {
			process.send(service);
		}
	});
} else {

	// ... otherwise hook into commonJS module systems
	module.exports = GenZip;
}
