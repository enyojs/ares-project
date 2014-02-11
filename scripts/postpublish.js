/*jshint node:true*/
/*global console, process, require*/
var path = require('path'),
    shell = require('shelljs'),
    deploys = require('./common.js').deploys;

var cmd = [process.env.npm_node_execpath, path.join(__dirname, "..", "enyo", "tools", "deploy.js") /*, "-v"*/].join(' ');
deploys.forEach(function(app) {
	console.log("> rm -rf " + app.o);
	shell.rm("-rf", app.o);
});
