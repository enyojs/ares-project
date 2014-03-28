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
    shell = require('shelljs'),
    semver = require('semver');

var processName = path.basename(process.argv[1]).replace(/.js/, '');

var knownOpts = {
    "help":            Boolean,
	"major":           Boolean,
	"minor":           Boolean,
	"patch":           Boolean,
	"pre":             Boolean,
	"rel":             Boolean,
	"dry-run":         Boolean,
	"level":           ['silly', 'verbose', 'info', 'http', 'warn', 'error']
};
var shortHands = {
	"h": "--help",
	"M": "--major",
	"m": "--minor",
	"p": "--patch",
	"r": "--pre",
	"R": "--rel",
	"l": "--level",
	"D": "--dry-run",
	"v": ["--level", "verbose"],
	"vv": ["--level", "silly"]
};
var usageString = [
	"",
	"Manage semantic version: M.m.p-pre.r, AKA (M)ajor.(m)inor.(p)atch-pre.(r)elease",
	"",
	"USAGE:",
	"\t" + process.argv[1] + " [OPTIONS] pre-dist",
	"\t" + process.argv[1] + " [OPTIONS] [-M|-m|-p|-R|-r] post-dist",
	"\t" + process.argv[1] + " -h|--help",
	"",
	"\t-M|--major:   increment the major version",
	"\t-m|--minor:   increment the minor version",
	"\t-p|--patch:   increment the patch level",
	"\t-r|--pre:     increment the pre-release number",
	"\t-R|--rel:     conclude the pre-release cycle (M.m.p-pre.r -> M.m.p)",
	"",
	"OPTIONS:",
	"\t-D|--dry-run: do not perform any action on disk",
	"\t-l|--level:   tracing level is one of 'silly', 'verbose', 'info', 'http', 'warn', 'error' [http]",
	""
];
var exampleString = [
	"EXAMPLES:",
	"\tSequence to tag, publish & prepare next minor version",
	"",
	"\t\t$ " + process.argv[1] + " pre-dist",
	"\t\t$ npm publish\n", 
	"\t\t$ " + process.argv[1] + " -m post-dist",
	"",
	"\tSequence to tag, package & prepare next pre-release",
	"",
	"\t\t$ cp `" + process.argv[1] + " pre-dist` /some/target/directory",
	"\t\t$ " + process.argv[1] + " -r post-dist",
	"",
	"\tSequence to tag, package & finalize current release (no more a pre-release)",
	"",
	"\t\t$ cp `" + process.argv[1] + " pre-dist` /some/target/directory",
	"\t\t$ " + process.argv[1] + " -R post-dist",
	""
];
var opt = nopt(knownOpts, shortHands, process.argv, 2 /*drop 'node' & 'ide.js'*/);

var doIt = !opt['dry-run'];
var log = npmlog;
log.level = opt.level || (doIt ? "http" : "info");
log.silly(processName, "argv:", opt);

process.on('uncaughtException', function (err) {
	log.error(processName, err.toString());
	log.verbose(processName, err.stack);
	process.exit(1);
});

var git, npm;
if (process.platform == 'win32') {
	git = "C:\\Program Files (x86)\\Git\\bin\\git.exe";
	npm = fs.existsSync("C:\\Program Files\\nodejs\npm") ? "C:\\Program Files\\nodejs\npm" : "C:\\Program Files (x86)\\nodejs\npm";
} else {
	git = "git";
	npm = "npm";
}

var packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json")));

if (!semver.valid(packageJson.version)) {
	throw new Error("Invalid package version: '" + version + "'");
}
var version = new semver.SemVer(packageJson.version);

/*
 * Internal structure of the SemVer object:
 * this: Object
 *   build: Array[0]
 *   loose: undefined
 *   major: 0
 *   minor: 2
 *   patch: 3
 *   prerelease: Array[2]
 *     0: "pre"
 *     1: 1
 *     length: 2
 *   raw: "0.2.3-pre.1"
 *   version: "0.2.3-pre.1"
 */

var command = opt.argv.remain.shift();
log.verbose(processName, "command:", command);

if (command === 'pre-dist') {
	preDist();
} else if (command === 'dist') {
	dist();
} else if (command === 'post-dist') {
	postDist();
} else if (opt.help) {
	help();
	process.exit(0);
} else {
	usage();
	throw new Error("Unknown command: '" + command + "'");
}

function usage() {
	usageString.forEach(function(line) {
		console.log(line);
	});
}

function help() {
	usage();
	exampleString.forEach(function(line) {
		console.log(line);
	});
}

function run(prefix, args, always, silent) {
	var cmd = args.join(" ");
	if (!silent) {
		log.info(prefix, cmd);
	} else {
		log.verbose(prefix, cmd);
	}
	if (doIt || always) {
		var p = shell.exec(cmd, { silent: silent, async: false });
		log.verbose(prefix, "code:", p.code);
		if (p.code !== 0) {
			// only if you set `silent: true` above
			//log.info(prefix, p.output);
			throw new Error("Failed: '" + cmd + "'");
		}
		return p.output;
	}
}

function preDist() {
	log.info("pre-dist", "version:", version.raw);

	log.info("pre-dist", "rm -rf node_modules");
	if (doIt) {
		shell.rm("-rf", "node_modules");
	}

	run("pre-dist", [git, "submodule", "update", "--init", "--recursive"]);
	run("pre-dist", [npm, "install"]);
	run("pre-dist", [npm, "run-script", "minify"]);
	run("pre-dist", [npm, "pack"]);
	console.log(packageJson.name + "-" + version.version + ".tgz");
}

function dist() {
	run("dist", [git, 'tag', version.version]);
	console.log("you can now run:");
	console.log("\t" + git + " push --tags origin");
	console.log("\t" + npm + " publish");
}

function postDist() {
	var pr;
	// update `version` in package.json
	log.info("post-dist", "before version:", version.raw);
	if (opt.major) {
		version.inc('major');
	} else if (opt.minor) {
		version.inc('minor');
	} else if (opt.patch) {
		version.inc('patch');
	} else if (opt.rel) {
		// Remove "-pre.r"
		version.prerelease = [];
		version.format();
	} else if (opt.pre) {
		pr = version.prerelease;
		// Force "-pre.r" as pre-release string format, with `r` starting at `1`
		pr[0] = "pre";
		pr[1] = version.prerelease[1] || 0;
		pr.splice(2, pr.length);
		version.inc('prerelease');
	} else {
		usage();
		throw new Error("You must specify a version component: --major|--minor|--patch|--pre");
	}
	log.info("post-dist", "after version:", version.version);

	packageJson.version = version.version;
	var out = JSON.stringify(packageJson, null, "\t");
	log.silly("post-dist", "package.json", out);

	// Remove former NPM dependencies snapshot
	log.info("post-dist", "rm -f npm-shrinkwrap.json");
	if (doIt) {
		shell.rm("-f", "npm-shrinkwrap.json");
	}

	// Update NPM dependencies
	run("post-dist", [npm, "update"]);

	// Snapshot NPM dependencies
	run("post-dist", [npm, "shrinkwrap"]);

	var branch = run("post-dist", [git, "rev-parse", "--abbrev-ref", "HEAD"], true, true);
	run("post-dist", [git, "commit", "-m", "\"start working on " + version.version + "\"", "package.json", "npm-shrinkwrap.json"]);

	console.log("you can now run:");
	console.log("\t" + git + " push origin " + branch);
}
