#!/usr/bin/env node_modules/mocha/bin/mocha
/**
 * ares.spec.js -- ARES server test suite
 */
var fs = require("fs"),
    path = require("path"),
    rimraf = require("rimraf"),
    optimist = require("optimist"),
    shell = require('shelljs'),
    temp = require("temp");

var argv = optimist
	    .usage('\nAres server tester.\nUsage: "$0 [OPTIONS]')
	    .options('k', {
		    alias : 'keep',
		    description: 'keep temporary files & folders',
		    boolean: true
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
	    .argv;

log(argv['$0'] + " running in verbose mode");
log("argv:", argv);

var myPort = 9019;
var myFsPath = temp.path({prefix: 'com.palm.ares.test.fs'});
fs.mkdirSync(myFsPath);

var mocha = path.resolve(__dirname, "node_modules", "mocha", "bin", "mocha");
var fsLocal = path.resolve("..", "..", "hermes","fsLocal.js");

run([mocha, "--bail",
     "fs.spec.js",
     "--filesystem", fsLocal,
     "--pathname", "/",
     "--root", myFsPath,
     "--port", myPort]);

if (!argv.keep) {
	rimraf(myFsPath, {gently: myFsPath}, function() {
		done();
	});
} else {
	done();
}

function log() {
	if (argv.verbose) {
		console.log.bind(this, this.name).apply(this, arguments);
	}
}

function run(args) {
	if (argv.verbose) {
		args.push("-v");
	}
	// Use '" "' instead of ' ' to let things work on Windows
	var command = '"' + args.join('" "') + '"';
	log("Running: '", command, "' from '", process.cwd(), "'");

	var report = shell.exec(command, { silent: false });
	if (report.code !== 0) {
		throw new Error("Fail: '" + command + "'\n" + report.output);
	}
}
