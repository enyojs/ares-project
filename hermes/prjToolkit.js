/**
 * Hermes Open webos build service
 */

require('./lib/checkNodeVersion');		// Check nodejs version

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    temp = require("temp"),
    http = require("http"),
    optimist = require('optimist'),
    rimraf = require("rimraf"),
    tools = require(__dirname + "/lib/project-gen"),
    CombinedStream = require('combined-stream');

var basename = path.basename(__filename);
var FORM_DATA_LINE_BREAK = '\r\n';
var performCleanup = true;

function BdOpenwebOS(config, next) {
	function HttpError(msg, statusCode) {
		Error.captureStackTrace(this, this);
		this.statusCode = statusCode || 500; // Internal-Server-Error
		this.message = msg || 'Error';
	}
	util.inherits(HttpError, Error);
	HttpError.prototype.name = "HTTP Error";

	console.log("config=",  util.inspect(config));

	tools.registerTemplates([{
		id: "bootplate-2.1.1-local",
		zipfiles: [{
			url: "templates/projects/bootplate-2.1.1.zip"
		}],
		description: "Enyo bootplate 2.1.1 (local)"
	}]);

	var app, server;
	if (express.version.match(/^2\./)) {
		// express-2.x
		app = express.createServer();
		server = app;
	} else {
		// express-3.x
		app = express();
		server = http.createServer(app);
	}

	/*
	 * Middleware -- applied to every verbs
	 */
	if (!this.quiet) {
		app.use(express.logger('dev'));
	}

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
	this.uploadDir = temp.path({prefix: 'com.palm.ares.hermes.bdOpenwebOS'}) + '.d';
	fs.mkdirSync(this.uploadDir);
	app.use(express.bodyParser({keepExtensions: true, uploadDir: this.uploadDir}));

	// Global error handler
	function errorHandler(err, req, res, next){
		console.error("errorHandler(): ", err.stack);
		res.status(err.statusCode || 500);
		res.contentType('txt'); // direct usage of 'text/plain' does not work
		res.send(err.toString());
	}

	if (app.error) {
		// express-2.x: explicit error handler
		app.error(errorHandler);
	} else {
		// express-3.x: middleware with arity === 4 is detected as the error handler
		app.use(errorHandler);
	}

	/*
	 * Verbs
	 */

	app.use(makeExpressRoute('/templates'), getList);
	app.use(makeExpressRoute('/generate'), generate);
	app.post(makeExpressRoute('/template-repos/:repoid'), addRepo);
	
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

	function getList(req, res, next) {
		tools.list(function(inError, inData) {
			res.status(200).send(inData).end();
		});
	}

	function addRepo(req, res, next) {
		tools.registerRemoteTemplates(req.body.url, function(err) {
			if (err) {
				next(new HttpError(err, 500));
				return;
			}
			res.status(200).end();
		});
	}

	function generate(req, res, next) {
		var destination = temp.path({prefix: 'com.palm.ares.hermes.bdOpenwebOS'}) + '.d';
		fs.mkdirSync(destination);

		tools.generate(req.body.templateId, JSON.parse(req.body.options), destination, {}, function(inError, inData) {
			if (inError) {
				next(new HttpError(inError, 500));
				return;
			}

			// Build the multipart/formdata
			var combinedStream = CombinedStream.create();
			var boundary = generateBoundary();
			var index = 0;
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
								next(new HttpError('Unable to read ' + filename, 500));
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
					index++;
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
					console.log("cleanup(): starting removal of " + destination);
					rimraf(destination, function(err) {
						console.log("cleanup(): removed " + destination);
					});
				} else {
					console.log("cleanup(): skipping removal of " + destination);
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

	function getPartFooter() {
		return FORM_DATA_LINE_BREAK;
	}

	function getLastPartFooter(boundary) {
		return '--' + boundary + '--';
	}
}

BdOpenwebOS.prototype.onExit = function() {
	var directory = this.uploadDir;
	rimraf(directory, function(err) {
		// Nothing to do
	});
};

// Main
if (path.basename(process.argv[1]) === basename) {
	// We are main.js: create & run the object...

	var argv = optimist.usage(
		"Ares Open webOS build service\nUsage: $0 [OPTIONS]", {
			'P': {
				description: "URL pathname prefix (before /deploy and /build",
				required: false,
				"default": "/openwebos"
			},
			'p': {
				description: "TCP port number",
				required: false,
				"default": "9029"
			},
			'e': {
				description: "Path to the Enyo version to use for minifying the application",
				required: false,
				"default": path.resolve(__dirname, '..', 'enyo')
			},
			'h': {
				description: "Display help",
				boolean: true,
				required: false
			}
		}).argv;
	
	if (argv.h) {
		optimist.showHelp();
		process.exit(0);
	}

	var obj = new BdOpenwebOS({
		pathname: argv.P,
		port: parseInt(argv.p, 10),
		enyoDir: argv.e
	}, function(err, service){
		if(err) process.exit(err);
		// process.send() is only available if the
		// parent-process is also node
		if (process.send) process.send(service);
	});

	process.on('SIGINT', obj.onExit.bind(obj));
	process.on('exit', obj.onExit.bind(obj));
} else {

	// ... otherwise hook into commonJS module systems
	module.exports = BdOpenwebOS;
}
