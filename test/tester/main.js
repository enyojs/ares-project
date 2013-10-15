/* global require, console, process, module */
var path = require('path'),
    os = require('os'),
	shell = require('./../../enyo/tools/node_modules/shelljs');

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

var enyoDir = path.resolve(tDir, '../enyo'),
	layoutDir = path.resolve(tDir, '../lib/layout'),
	onyxDir = path.resolve(tDir, '../lib/onyx'),
	lib = path.resolve(testDir, 'HelloWorld/lib');

(function() {

    var tester = {
			setup: function(req, res, next) {

				// cleanup
				tester.cleanup();
				// setup test/root and sub-directories
				shell.mkdir('-p', path.join(testDir));
				shell.mkdir('-p', path.join(newProjectDir));
				shell.mkdir('-p', path.join(helloTestDir));
				shell.mkdir('-p', path.join(fopsTestDir));

				// import the HelloWorld project and dependencies from test/samples
				shell.cp('-R', path.join(helloSrcDir), path.join(testDir));
				shell.cd(path.join(helloTestDir));
				shell.mkdir('-p', path.join(lib));
				if (os.type() === 'Windows_NT') {
					shell.cp('-R', path.join(enyoDir), path.join(helloTestDir));
					shell.cd('lib');
					shell.cp('-R', path.join(layoutDir), path.join(lib));
					shell.cp('-R', path.join(onyxDir), path.join(lib));
				} else {
					// symlinks foes not exist on Windows
					shell.exec('/bin/ln -s ../../../enyo enyo');
					shell.exec('/bin/ln -s ../../../../lib/layout lib/layout');
					shell.exec('/bin/ln -s ../../../../lib/onyx lib/onyx');	
				}
				// import the FileOps dir from test/samples
				shell.cd(path.join(fopsTestDir));
				shell.cp('-R', path.join(fopsSrcDir), path.join(testDir));

				console.info('AresTest Setup done!');
				res.status(200);
				next();
			},
			cleanup: function(next) {
				// cleanup test/root
				shell.cd(path.join(tDir));
				shell.rm('-rf', path.join(rDir));
			}
		};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = tester;
	}
        
}());
