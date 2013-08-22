#!/usr/bin/env node
/* jshint node:true */
var fork = require('child_process').fork;
var path = require('path');
process.chdir(path.join(__dirname, '..'));
var cmd = path.join('node_modules', 'jshint', 'bin', 'jshint');
var args = ['.'];
console.log('> node ' + cmd + ' ' + args.join(' '));
fork(cmd, args);
