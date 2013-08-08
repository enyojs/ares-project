/* global require, console, exports */
var config = require('./config.js'),
	Dropbox = require('dropbox').DropboxClient;

exports.route = function(req, res) {
	console.log('');
	console.log('');
	console.log("request auth: ", req.param("user"), req.param("password"));
	//
	connect(req.param("user"), req.param("password"), function(inErr, inResponse) {
		console.log("response: ", inErr || inResponse);
		res.send(inErr || inResponse);
	});
};

function connect(inUser, inPassword, next) {
	new Dropbox(config.key, config.secret)
		.getAccessToken(inUser, inPassword,
			function(err, token, secret) {
				next(err, {token: token, secret: secret});
			}
		);
}