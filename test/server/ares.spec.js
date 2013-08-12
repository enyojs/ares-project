#!/usr/bin/env ../../node_modules/mocha/bin/mocha
/* global require, console, process, it, describe, __dirname */
/**
 * ares.spec.js -- ARES server test suite
 */
var path = require("path"),
    fs = require("fs"),
    shell = require('shelljs'),
    npmlog = require('npmlog'),
    temp = require("temp"),
    rimraf = require("rimraf"),
    async = require("async");

var knownOpts = {
	"config":	path,
	"help":		Boolean,
	"level":	['silly', 'verbose', 'info', 'http', 'warn', 'error']
};
var shortHands = {
	"c": "--config",
	"h": "--help",
	"l": "--level",
	"v": "--level verbose"
};
var helpString = [
	"",
	"Ares server tester.",
	"Usage: '" + process.argv[0] + " " + process.argv[1] + " [OPTIONS]",
	"",
	"Options:",
	"  -c, --config   path to ide.json        [default: '" + path.resolve(__dirname, "..", "..", "ide.json") + "]",
	"  -h, --help     help message            [boolean]",
	"  -v, --verbose  verbose execution mode  [boolean]",
	"  -q, --quiet    really quiet            [boolean]",
	""
];

var argv = require('nopt')(knownOpts, shortHands, process.argv, 2 /*drop 'node' & basename*/);
argv.config = argv.config || path.resolve(__dirname, "..", "..", "ide.json");

if (argv.help) {
	helpString.forEach(function(s) { console.log(s); });
	process.exit(0);
}

/**********************************************************************/

var log = npmlog;
log.heading = 'ares.spec';
log.level = argv.level || 'error';

/**********************************************************************/

log.verbose("main", "running in verbose mode");
log.verbose("main", "argv:", argv);

var mocha = process.argv[1];
var myPort = 9019;

log.verbose("main", "loading " + argv.config);
var config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));
log.verbose("main", "config:", config);

var myTestDir = "_test";

/*
 * test suite
 */

describe("Testing filesystems", function() {
	var dropbox = config.services.filter(function(service) {
		return service.id === 'dropbox';
	})[0];
	if (dropbox && dropbox.auth && dropbox.auth.appKey) {
		it("fsDropbox", function(done) {
			var fsDropbox = path.resolve(__dirname, "..", "..", "hermes","fsDropbox.js");
			var myTestDir = "_test";
			var myDropboxApp = 'com.enyojs.ares';
			// Assume a user's account grip in the local file-system.
			var myTestDirPath = [getHome(), 'Dropbox', 'Apps', myDropboxApp, myTestDir].join('/');
			async.series([
				function(next) {
					rimraf(myTestDirPath, next);
				},
				function(next) {
					setTimeout(next, 1500);
				},
				function(next) {
					run([mocha, "--bail",
					     "--timeout", "5000", // This timeout may vary, depending on the network conditions
					     "--reporter", "spec",
					     path.resolve(__dirname, "fs.spec.js"),
					     "--level", argv.level,
					     "--filesystem", fsDropbox,
					     "--pathname", "/",
					     "--port", myPort,
					     "--dir", myTestDir,
					     "--auth", encodeURIComponent(JSON.stringify(dropbox.auth))]);
					next();
				},
				function(next) {
					rimraf(myTestDirPath, next);
				}
			], function(err) {
				done();
			});
		});
	}
	it("fsLocal", function(done) {
		this.timeout(15000);

		var fsLocal = path.resolve(__dirname, "..", "..", "hermes","fsLocal.js");
		var myFsPath = temp.path({prefix: 'com.palm.ares.test.fs'});
		
		fs.mkdirSync(myFsPath);
		
		run([mocha, "--bail",
		     "--reporter", "spec",
		     path.resolve(__dirname, "fs.spec.js"),
		     "--level", log.level,
		     "--filesystem", fsLocal,
		     "--pathname", "/",
		     "--port", myPort,
		     "--dir", myTestDir,
		     "--root", myFsPath]);
		
		fs.rmdir(myFsPath, done);
	});
});

/*
 * utilities
 */

function run(args) {
	// Use '" "' instead of ' ' to let things work on Windows
	var command = args.shift() + ' "' + args.join('" "') + '"';
	log.verbose("main", "Running: '", command, "' from '", process.cwd(), "'");

	var report = shell.exec(command, { silent: false });
	if (report.code !== 0) {
		throw new Error("Fail: '" + command + "'\n" + report.output);
	}
}

function getHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}
