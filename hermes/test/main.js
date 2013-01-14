#!/usr/bin/env node

// Default Dependencies
var path = require('path'),
    fs = require('fs'),
	shell = require('../../enyo/tools/node_modules/shelljs');

// Local variables
var srcDir = process.cwd(),
	resDir = path.resolve(srcDir, 'test/root');

// Create the result directory needed by the Ares Test Suite
shell.mkdir('-p', path.join(resDir));
