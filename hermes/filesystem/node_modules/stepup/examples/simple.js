var step = require('../lib/stepup');
var fs = require('fs');

step(function(err, next) {
	console.log('\nThis is a long stack trace: \n', err.stack);
	next('Ignore error and pass this instead.');
}, function() {
	var next = this;
	setTimeout(function() {
		fs.readFile('does not exist', next);
	}, 100);
}, function(data) {
	console.log('Post error: ', data);
});
