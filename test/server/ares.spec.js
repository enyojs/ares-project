#!/usr/bin/env node_modules/mocha/bin/mocha
/* jshint node:true */
/* global describe */
/**
 * ares.spec.js -- ARES server test suite
 */
var path = require("path"),
    fs = require("graceful-fs"),
    npmlog = require('npmlog'),
    temp = require("temp"),
    mkdirp = require("mkdirp"),
    rimraf = require("rimraf");

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

var myPort = 9019;

log.verbose("main", "loading " + argv.config);
var config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));
log.verbose("main", "config:", config);

var myTestDir = "_test";

/*
 * test suite
 */

function getHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

describe("Testing filesystems", function() {
	var FsSpec = require("./fs.spec.js");

	var dropbox = config.services.filter(function(service) {
		return service.id === 'dropbox';
	})[0];
	if (dropbox && dropbox.auth && dropbox.auth.appKey) {
		describe("fsDropbox", function(done) {
			var myDropboxApp = 'com.enyojs.ares';
			// Assume a user's account grip in the local file-system.
			var myTestDirPath = path.join(getHome(), 'Dropbox', 'Apps', myDropboxApp, myTestDir);
			rimraf.sync(myTestDirPath);
			mkdirp.sync(myTestDirPath);
			new FsSpec({
				filesystem: "./../../hermes/fsDropbox.js",
				pathname: "/",
				port: myPort,
				dir: myTestDir,
				level: argv.level,
				auth: dropbox.auth
			});
		});
	}

	describe("fsLocal", function() {
		var myFsPath = temp.mkdirSync({prefix: 'com.palm.ares.test.fs'});
		new FsSpec({
			filesystem: "./../../hermes/fsLocal.js",
			pathname: "/",
			port: myPort,
			dir: myTestDir,
			level: argv.level,
			root: myFsPath
		});
	});
});
