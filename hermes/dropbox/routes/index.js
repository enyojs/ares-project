/* global require, module */
var auth = require('./auth.js'),
	list = require('./list.js'),
	get = require('./get.js'),
	put = require('./put.js');

module.exports = {
	auth: auth.route,
	list: list.route,
	get: get.route,
	put: put.route
};