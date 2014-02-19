/*jshint node:true*/
/*global console, require*/
var shell = require('shelljs'),
    deploys = require('./common.js').deploys;

deploys.forEach(function(app) {
	console.log("> rm -rf " + app.o);
	shell.rm("-rf", app.o);
});
