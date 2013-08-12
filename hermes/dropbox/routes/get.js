/* global require, console, exports */
var config = require('./config.js'),
	DropboxClient = require('dropbox').DropboxClient;

exports.route = function(req, res) {
	var auth_token = req.param("token"),
		auth_secret = req.param("secret"),
		path = req.params[0];
	//
	console.log('');
	console.log('');
	console.log("request get: ", auth_token, auth_secret, path);
	console.log("config: ", config);
	//console.log(req.params);
	//
	var dropbox = new DropboxClient(config.key, config.secret, auth_token, auth_secret);
	//
	var request = dropbox.getFileStream(path);
	request.on('response', function(response) {
		response.pipe(res);
	});
	request.on('error', function(response) {
		response.send("error");
	});
	request.end();
};
