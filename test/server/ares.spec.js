#!/usr/bin/env node_modules/mocha/bin/mocha --bail
/**
 * ares.spec.js -- ARES server test suite
 */
var path = require("path"),
    fs = require("fs"),
    optimist = require("optimist"),
    shell = require('shelljs'),
    temp = require("temp"),
    rimraf = require("rimraf"),
    async = require("async");

var argv = optimist
	    .usage('\nAres server tester.\nUsage: "$0 [OPTIONS]')
	    .options('c', {
		    alias : 'config',
		    description: 'path to ide.json',
		    default: path.resolve(__dirname, "..", "..", "ide.json")
	    })
	    .options('h', {
		    alias : 'help',
		    description: 'help message',
		    boolean: true
	    })
	    .options('v', {
		    alias : 'verbose',
		    description: 'verbose execution mode',
		    boolean: true
	    })
	    .options('q', {
		    alias : 'quiet',
		    description: 'really quiet',
		    boolean: true
	    })
	    .argv;

if (argv.help) {
	optimist.showHelp();
	process.exit(0);
}

if (argv.quiet) {
	argv.verbose = false;
}

log("running in verbose mode");
log("argv:", argv);

var mocha = path.resolve(__dirname, "node_modules", "mocha", "bin", "mocha");
var myPort = 9019;

log("loading " + argv.config);
var config = JSON.parse(fs.readFileSync(argv.config, 'utf8'));
log("config:", config);

var myTestDir = "_test";

/*
 * test suite
 */

describe("Testing filesystems", function() {
	it("fsDropbox", function(done) {
		var dropbox = config.services.filter(function(service) {
			return service.id === 'dropbox';
		})[0];
		if (dropbox && dropbox.auth && dropbox.auth.appKey) {
			var fsDropbox = path.resolve("..", "..", "hermes","fsDropbox.js");
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
					     "fs.spec.js",
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
		}
	});
	it("fsLocal", function(done) {
		var fsLocal = path.resolve("..", "..", "hermes","fsLocal.js");
		var myFsPath = temp.path({prefix: 'com.palm.ares.test.fs'});
		
		fs.mkdirSync(myFsPath);
		
		run([mocha, "--bail",
		     "--reporter", "spec",
		     "fs.spec.js",
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

function log() {
	if (argv.verbose) {
		console.log.bind(this, this.name).apply(this, arguments);
	}
}

function run(args) {
	if (argv.verbose) {
		args.push("-v");
	}
	if (argv.quiet) {
		args.push("-q");
	}
	// Use '" "' instead of ' ' to let things work on Windows
	var command = '"' + args.join('" "') + '"';
	log("Running: '", command, "' from '", process.cwd(), "'");

	var report = shell.exec(command, { silent: false });
	if (report.code !== 0) {
		throw new Error("Fail: '" + command + "'\n" + report.output);
	}
}

function getHome() {
	return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}