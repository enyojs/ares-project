#!/usr/bin/env node
/* jshint node:true */

/*
 * Note to the maintainer: this script is expected to be run
 * exclusivelly by the ares-ide owner (or a deputy).  As a result it
 * uses synchronous operations for readability whenever possible.
 */

var path = require('path'),
    fs = require('fs'),
    nopt = require('nopt'),
    npmlog = require('npmlog'),
    shelljs = require('shelljs'),
    semver = require('semver');

var processName = path.basename(process.argv[1]).replace(/.js/, '');

var knownOpts = {
        "help":            Boolean,
        "major":           Boolean,
        "minor":           Boolean,
        "patch":           Boolean,
        "pre":             Boolean,
        "level":           ['silly', 'verbose', 'info', 'http', 'warn', 'error']
};
var shortHands = {
	"h": ["--help"],
	"M": ["--major"],
	"m": ["--minor"],
	"p": ["--patch"],
	"X": ["--pre"],
	"l": ["--level"],
	"v": ["--level verbose"],
	"vv": ["--level silly"]
};
var helpString = [
	"",
	"USAGE:",
	"\t" + processName + " [OPTIONS][-M][-m][-p][-X] upgrade",
	"\t" + processName + " -h|--help",
	"",
	"OPTIONS:",
	"\t--level|-l: tracing level is one of 'silly', 'verbose', 'info', 'http', 'warn', 'error' [http]",
	""
];
var argv = nopt(knownOpts, shortHands, process.argv, 2 /*drop 'node' & 'ide.js'*/);

var log = npmlog;
log.level = argv.level || "http";

var git, npm;
if (process.platform == 'win32') {
	git = "C:\\Program Files (x86)\\Git\\bin\\git.exe";
	npm = fs.existsSync("C:\\Program Files\\nodejs\npm") ? "C:\\Program Files\\nodejs\npm" : "C:\\Program Files (x86)\\nodejs\npm";
} else {
	git = "git";
	npm = "npm";
}

var packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json")));

var version = packageJson.version;
if (!semver.valid(version)) {
	throw new Error("Invalid package version: '" + version + "'");
}

var command = argv.argv.remain.shift();
if (command === 'upgrade') {
	op = upgrade;
} else if (argv.help) {
	helpString.forEach(function(line) {
		console.log(line);
	});
	process.exit(0);
} else {
	usage();
	process.exit(1);
}

function usage() {
	helpString.forEach(function(line) {
		console.log(line);
	});
}

function upgrade() {
	
}