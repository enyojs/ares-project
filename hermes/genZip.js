/* jshint node:true */

/**
 * Project Generator based on ZIP-files
 */

// nodejs version checking is done in parent process ide.js

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    log = require('npmlog'),
    temp = require("temp"),
    async = require("async"),
    rimraf = require("rimraf"),
    ptools = require("ares-generator"),
    ServiceBase = require("./lib/svcBase");

var basename = path.basename(__filename, '.js');
log.heading = basename;

function GenZip(config, next) {
	if (config.performCleanup === undefined) {
		config.performCleanup = true;
	}
	ServiceBase.call(this, config, next);
}

util.inherits(GenZip, ServiceBase);

/**
 * Additionnal middlewares: 'this.app.use(xxx)'
 * @protected
 */
GenZip.prototype.use = function() {
	log.verbose('GenZip#use()'); 
	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.<field>[], req.body.file[]
	this.uploadDir = temp.path({prefix: 'com.enyojs.ares.services.genZip'}) + '.d';
	fs.mkdirSync(this.uploadDir);
	this.app.use(express.bodyParser({keepExtensions: true, uploadDir: this.uploadDir}));
};

/**
 * Additionnal routes/verbs: 'this.app.get()', 'this.app.port()'
 * @protected
 */
GenZip.prototype.route = function() {
	log.verbose('GenZip#route()'); 
	this.app.post(this.makeExpressRoute('/op/generate'), this.generate.bind(this));
	this.app.get(this.makeExpressRoute('/config/sources'), this.getSources.bind(this));
};

GenZip.prototype.getSources = function(req, res, next) {
	log.info("GenZip#getSources()");
	this.tools.getSources(req.query.type, function(err, sources) {
		if (err) {
			setImmediate(next, err);
		} else {
			log.info("getSources()", "sources:", sources);
			res.status(200).send(sources).end();
		}
	});
};

GenZip.prototype.generate = function(req, res, next) {
	log.info("GenZip#generate()");
	var destination;
	
	async.waterfall([
		this.tools.generate.bind(this, JSON.parse(req.body.sourceIds), JSON.parse(req.body.substitutions), undefined /*destination*/, {
			overwrite: req.param("overwrite") === 'true'
		}),
		(function _out(fileMap, tmpDir, next) {
			log.silly("GenZip#generate#_out()", "fileMap:", fileMap);
			destination = tmpDir;
			var parts = fileMap.map(function(file) {
				return({
					filename: file.name,
					path: file.path
				});
			});
			this.returnFormData(parts, res, next);
		}).bind(this),
		function _end(next) {
			if (destination) {
				log.verbose("GenZip#generate#_end()", "rm -rf", destination);
				rimraf(destination, next);
			} else {
				setImmediate(next);
			}
		}
	], function(err) {
		if (err) {
			// report errors...
			next(err);
		}
		// ...but not success, as the success header was
		// already sent.
	});
};

GenZip.prototype.configure = function(config, next) {
	log.silly("GenZip#configure()", "old config:", this.config);
	log.silly("GenZip#configure()", "inc config:", config);
	util._extend(this.config, config);
	log.verbose("GenZip#configure()", "new config:", this.config);
	this.tools = new ptools.Generator(this.config, next);
};

// Main
if (path.basename(process.argv[1], '.js') === basename) {
	// We are main.js: create & run the object...

	var knownOpts = {
		"port":		Number,
		"timeout":	Number,
		"pathname":	String,
		"level":	['silly', 'verbose', 'info', 'http', 'warn', 'error'],
		"help":		Boolean
	};
	var shortHands = {
		"p": "port",
		"t": "timeout",
		"P": "pathname",
		"l": "--level",
		"v": "--level verbose",
		"h": "help"
	};
	var argv = require('nopt')(knownOpts, shortHands, process.argv, 2 /*drop 'node' & basename*/);
	log.level = argv.level || "http";
	argv.pathname = argv.pathname || "/genZip";
	argv.port = argv.port || 0;
	argv.level = log.level;
	if (argv.help) {
		console.log("Usage: node " + basename + "\n" +
			    "  -p, --port        port (o) local IP port of the express server (0: dynamic)                       [default: '0']\n" +
			    "  -t, --timeout     milliseconds of inactivity before a server socket is presumed to have timed out [default: '120000']\n" +
			    "  -P, --pathname    URL pathname prefix (before /deploy and /build                                  [default: '/genZip']\n" +
			    "  -l, --level       debug level ('silly', 'verbose', 'info', 'http', 'warn', 'error')               [default: 'http']\n" +
			    "  -h, --help        This message\n");
		process.exit(0);
	}

	new GenZip({
		pathname: argv.pathname,
		port: argv.port,
		timeout: argv.timeout
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
