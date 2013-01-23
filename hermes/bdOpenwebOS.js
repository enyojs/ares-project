/**
 * Hermes PhoneGap build service
 */

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    querystring = require("querystring"),
    temp = require("temp"),
    zipstream = require('zipstream'),
    async = require("async"),
    mkdirp = require("mkdirp"),
    http = require("http"),
    child_process = require("child_process"),
    optimist = require('optimist'),
    tools = require('nodejs-module-webos-ipkg'),
    FormData = require('form-data');

var basename = path.basename(__filename);

function BdOpenwebOS(config, next) {
	function HttpError(msg, statusCode) {
		Error.captureStackTrace(this, this);
		this.statusCode = statusCode || 500; // Internal-Server-Error
		this.message = msg || 'Error';
	}
	util.inherits(HttpError, Error);
	HttpError.prototype.name = "HTTP Error";

	tools.addTemplates([
        {
            id: "enyo_singlepane",
            url: "templates//projects/enyo_singlepane.zip",
            description: "Enyo singlepane"
        },
        {
            id: "enyo_multipane",
            url: "templates//projects/enyo_multipane.zip",
            description: "Enyo multipane"
        }
    ]);

	console.log("config=",  util.inspect(config));

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

	app.use(express.logger('dev'));

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
	var uploadDir = temp.path({prefix: 'com.palm.ares.hermes.bdOpenwebOS'}) + '.d';
	fs.mkdirSync(uploadDir);
	app.use(express.bodyParser({keepExtensions: true, uploadDir: uploadDir}));

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

	function generate(req, res, next) {
		var destination = temp.path({prefix: 'com.palm.ares.hermes.bdOpenwebOS'}) + '.d';
		fs.mkdirSync(destination);

		tools.generate(req.body.templateId, JSON.parse(req.body.options), destination, function(inError, inData) {
			if (inError) {
				next(new HttpError(inError, 500));
				return;
			}

			// Build the multipart/formdata
			var form = new FormData();
			inData.forEach(function(file) {
				if (fs.statSync(file).isFile()) {
					var stream = fs.createReadStream(file);
					form.append('file', stream);
				}
			});

			// Send the files back as a multipart/form-data
			res.status(200);
			res.header('Content-Type', 'multipart/form-data; boundary=' + form.getBoundary());
			form.pipe(res);

			// TODO cleanup the temp dir when the response has been sent
		});
	}
}

// Main
if (path.basename(process.argv[1]) === basename) {
	// We are main.js: create & run the object...

	var version = process.version.match(/[0-9]+.[0-9]+/)[0];
	if (version <= 0.7) {
		process.exit("Only supported on Node.js version 0.8 and above");
	}

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

	new BdOpenwebOS({
		pathname: argv.P,
		port: parseInt(argv.p, 10),
		enyoDir: argv.e
	}, function(err, service){
		if(err) process.exit(err);
		// process.send() is only available if the
		// parent-process is also node
		if (process.send) process.send(service);
	});

} else {

	// ... otherwise hook into commonJS module systems
	module.exports = BdOpenwebOS;
}
