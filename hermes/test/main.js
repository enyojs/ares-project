#!/usr/bin/env node

// Default Dependencies
var path = require('path'),
    fs = require('fs'),
	shell = require('../../enyo/tools/node_modules/shelljs');

// Local variables
var srcDir = process.cwd(),
	runnerDir = path.resolve(srcDir, 'test/root'),
	seleniumDir = path.resolve(srcDir, 'test/root/TestSelenium'),
	newpDir = path.resolve(srcDir, 'test/root/TestSelenium/NewProject'),
	helloTestDir = path.resolve(srcDir, 'test/root/TestSelenium/HelloWorld'),
	helloDir = path.resolve(srcDir, 'hermes/filesystem/root/HelloWorld'),
	sourcefile = path.resolve(srcDir, 'enyo'),
	targetfile = path.resolve(srcDir, 'test/root/TestSelenium/HelloWorld/enyo'),
	lib = path.resolve(srcDir, 'test/root/TestSelenium/HelloWorld/lib');

// cleanup and set up the dedicated source tree either for TestRunner and Selenium
shell.rm('-rf', path.join(runnerDir));
shell.mkdir('-p', path.join(runnerDir));
shell.mkdir('-p', path.join(newpDir));
// import the HelloWorld project and dependencies from hermes/filesystem/root
shell.cp('-R', path.join(helloDir), path.join(seleniumDir));
shell.cd(path.join(helloTestDir));
shell.mkdir('-p', path.join(lib));
shell.exec('/bin/ln -s ../../../../enyo enyo');
shell.exec('/bin/ln -s ../../../../../lib/layout lib/layout');
shell.exec('/bin/ln -s ../../../../../lib/onyx lib/onyx');