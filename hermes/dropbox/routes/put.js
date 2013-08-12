/* global require, console, exports */
var config = require('./config.js'),
	DropboxClient = require('dropbox').DropboxClient;

exports.route = function(req, res) {
	var auth_token = req.param("token"),
		auth_secret = req.param("secret"),
		content = req.param("content"),
		path = req.params[0];
	//
	path = path.replace(/\s$/, '');
	//
	console.log('');
	console.log('');
	console.log("request put: ", auth_token, auth_secret, path);
	console.log("config: ", config);
	console.log(content.length + " chars");
	//
	var dropbox = new DropboxClient(config.key, config.secret, auth_token, auth_secret);
	dropbox.put(content || '', path, function() {
		res.send("{response: 'ok'}");
	});
};
