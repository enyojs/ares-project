var fs = require('fs');
var step = require('../lib/stepup');

step(
	function errorHandler(err, next) {
		// log and ignore
		console.log('\nThis is the long stack trace from an async error: \n', err.stack);
		next('some data');
	},
	function readSelf() {
		fs.readFile(__filename, this);
	},
	function capitalize(text) {
		return (''+text).toUpperCase();
	},
	function showIt(newText) {
		console.log(newText);
		throw new Error('fail.');
	},
	function afterError(data) {
		console.log('\nThis is after errorHandler has been called: \n', data);
	}
);