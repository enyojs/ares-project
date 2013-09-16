/* jshint node:true */

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
    async = require("async"),
    rimraf = require("rimraf"),
    ptools = require("ares-generator"),
    CombinedStream = require('combined-stream'),
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
}

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
	
	var destination = temp.mkdirSync({prefix: 'com.enyojs.ares.services.genZip'});
	this.tools.generate(JSON.parse(req.body.sourceIds), JSON.parse(req.body.substitutions), destination, {
		overwrite: req.param("overwrite") === 'true'
	}, (function(err, fileList) {
		// XXX each item in filelist should
		// XXX include only files & be
		// XXX relative to the desination dir.
		if (err) {
			log.error("GenZip#generate()", err);
			//log.silly("GenZip#generate()", "arguments:", arguments);
			setImmediate(next, err);
			return;
		}

		async.map(fileList, function(file, next) {
			fs.stat(file, function(err, stat) {
				if (err) {
					// abort on error
					setImmediate(next, err);
				} else if (stat.isFile()) {
					// keep file path
					setImmediate(next, null, {
						filename: file.substr(destination.length + 1),
						path: file
					});
				} else {
					// skip non-file
					setImmediate(next);
				}
			});
		}, (function(err, results) {
			// filter-out falsies left in place by async.map() above
			var parts = results.filter(function(part) {
				return !!part;
			});
			this.returnFormData(parts, res, (function _cleanup(err) {
				// cleanup the temp dir when the response has been sent
				if (this.config.performCleanup) {
					log.verbose("GenZip#generate#_cleanup", "starting removal of " + destination);
					rimraf(destination, function(err) {
						log.verbose("cleanup", "removed " + destination);
					});
				} else {
					log.verbose("GenZip#generate#_cleanup", "skipping removal of " + destination);
				}
				if (err) {
					setImmediate(next, err);
				}
				// HTTP success was already sent in case no error happenned.
			}).bind(this));
		}).bind(this));
	}).bind(this));
};

GenZip.prototype.configure = function(config, next) {
	log.silly("BdBase#configure()", "old config:", this.config);
	log.silly("BdBase#configure()", "inc config:", config);
	util._extend(this.config, config);
	log.verbose("BdBase#configure()", "new config:", this.config);
	this.tools = new ptools.Generator(this.config, next);
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

	log.level = argv.level;

	new GenZip({
		pathname: argv.pathname,
		port: argv.port
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
