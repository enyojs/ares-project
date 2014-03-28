/*jshint node:true*/
/*global console, process, require*/
var path = require('path'),
    shell = require('shelljs'),
    deploys = require('./common.js').deploys;

//FIXME: add "npm dedupe"

var node = '"' + process.env.npm_node_execpath + '"';

var cmd = [node, path.join(__dirname, "..", "enyo", "tools", "deploy.js") /*, "-v"*/].join(' ');
deploys.forEach(function(app) {
	var cmdline = [cmd];
	for (var opt in app) {
		cmdline = cmdline.concat(["-" + opt, app[opt]]);
	}
	console.log("Deploying '" + app.o + "'");
	console.log("> " + cmdline);
	var p = shell.exec(cmdline.join(" "), { silent: false, async: false });
	if (p.code !== 0) {
		// only if you set `silent: true` above
		//log.info(prefix, p.output);
		throw new Error("Failed: '" + cmdline + "'");
	}
});
