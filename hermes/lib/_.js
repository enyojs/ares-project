/* global require, console, module */
var _ = require('underscore'), 
	_s = require('underscore.string'),
	extend = require('node.extend');

_.mixin(_s.exports());

_.extend = extend;

_.mask = function mask(obj, keys) {
	var ret;

	ret = {};
	if (!Array.isArray(keys)) {
		keys = Object.keys(keys);
	}

	for (var i = 0, l = keys.length; i < l; ++i) {
		if (obj.hasOwnProperty(keys[i])) {
			ret[keys[i]] = obj[keys[i]];
		}
	}
	return ret;
};

_.bindr = function(fn, that) {
	var args;

	if (typeof fn !== "function") {
		// closest thing possible to the ECMAScript 5 internal IsCallable function
		throw new TypeError("_.bindr - what is trying to be bound is not callable");
	}

	args = Array.prototype.slice.call(arguments, 2);

	return function(a) {
		return fn.apply(that, Array.prototype.slice.call(arguments).concat(args));
	};
};

_.log = function(fn) {
	return function() {
		console.log.apply(this, arguments);
		return fn.apply(this, arguments);
	};
};

_.debug = function(fn) {
	return function() {
		return fn.apply(this, arguments);
	};
};

module.exports = _;