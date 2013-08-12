/* global require, module, console  */
// Connect middleware for debugging using trycatch

var trycatch = require('trycatch');

function debug(onError) {
	onError = onError || function(req, res, err) {
		console.log(err.stack);
		res.writeHead(500);
		res.end(err.stack);
	};

	return function (req, res, next) {
		console.log(req.url);
		trycatch(next, onError.bind(null, req, res));
	};
}

module.exports = debug;