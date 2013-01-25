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
	helloSrcDir = path.resolve(srcDir, 'test/samples/HelloWorld'),
	lib = path.resolve(srcDir, 'test/root/HelloWorld/lib'),
	fopsTestDir = path.resolve(srcDir, 'test/root/FileOps'),
	fopsSrcDir = path.resolve(srcDir, 'test/samples/FileOps');

// cleanup and set up the dedicated source tree either for TestRunner and Selenium
// cleanyp test/root
shell.cd(path.join(tDir));
shell.rm('-rf', path.join(rDir));
// setup test/root
shell.mkdir('-p', path.join(testDir));
shell.mkdir('-p', path.join(newProjectDir));
shell.mkdir('-p', path.join(helloTestDir));
shell.mkdir('-p', path.join(fopsTestDir));
// import the HelloWorld project and dependencies from test/samples
shell.cp('-R', path.join(helloSrcDir), path.join(testDir));
shell.cd(path.join(helloTestDir));
shell.mkdir('-p', path.join(lib));
shell.exec('/bin/ln -s ../../../enyo enyo');
shell.exec('/bin/ln -s ../../../../lib/layout lib/layout');
shell.exec('/bin/ln -s ../../../../lib/onyx lib/onyx');
// import the FileOps dir from test/samples
shell.cd(path.join(fopsTestDir));
shell.cp('-R', path.join(fopsSrcDir), path.join(testDir));