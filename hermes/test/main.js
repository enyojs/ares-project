#!/usr/bin/env node

// Default Dependencies
var path = require('path'),
    fs = require('fs'),
	shell = require('../../enyo/tools/node_modules/shelljs');

// Local variables
var srcDir = process.cwd(),
	tDir = path.resolve(srcDir, 'test'),
	rDir = path.resolve(tDir, 'root'),
	testDir = path.resolve(srcDir, 'test/root'),
	newProjectDir = path.resolve(srcDir, 'test/root/NewProject'),
	helloTestDir = path.resolve(srcDir, 'test/root/HelloWorld'),
	helloDestDir = path.resolve(srcDir, 'hermes/filesystem/root/HelloWorld'),
	lib = path.resolve(srcDir, 'test/root/HelloWorld/lib');

// cleanup and set up the dedicated source tree either for TestRunner and Selenium
shell.cd(path.join(tDir));
shell.rm('-rf', path.join(rDir));
shell.mkdir('-p', path.join(testDir));
shell.mkdir('-p', path.join(newProjectDir));
shell.mkdir('-p', path.join(helloTestDir));
// import the HelloWorld project and dependencies from hermes/filesystem/root
shell.cp('-R', path.join(helloDestDir), path.join(testDir));
shell.cd(path.join(helloTestDir));
shell.mkdir('-p', path.join(lib));
shell.exec('/bin/ln -s ../../../enyo enyo');
shell.exec('/bin/ln -s ../../../../lib/layout lib/layout');
shell.exec('/bin/ln -s ../../../../lib/onyx lib/onyx');