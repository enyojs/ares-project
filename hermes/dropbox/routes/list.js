/* global require, console, exports */
var config = require('./config.js'),
	DropboxClient = require('dropbox').DropboxClient,
	path = require('path');

exports.route = function(req, res) {
	var auth_token = req.param("token"),
		auth_secret = req.param("secret"),
		path = req.params[0];
	//
	console.log('');
	console.log('');
	console.log("request list: ", auth_token, auth_secret, path);
	console.log("config: ", config);
	//console.log(req.params);
	//
	var dropbox = new DropboxClient(config.key, config.secret, auth_token, auth_secret);
	//
	list(dropbox, path, function(inErr, inResponse) {
		console.log("response: ", inErr || inResponse);
		res.send(inErr || inResponse);
	});
};

function list(inDropbox, inPath, next) {
	inDropbox.getMetadata(inPath, function(err, data) {
		var i, n, entries = [];
		//
		err = err || (!data.is_dir && new Error('Invalid directory passed.'));
		if (err) {
			return next(err);
		}
		//
		for (i=0; (n=data.contents[i]); i++) {
			n.path = n.path.replace(/^\/+/, '');
			if ({".": 1, "..": 1}[n.path]) {
				continue;
			}
			entries.push({
				id: n.path,
				path: n.path,
				name: path.basename(n.path),
				isDir: n.is_dir
			});
		}
		//
		console.log('Listed, ', inPath, ': ', entries);
		next(null, {contents: entries});
	});
}