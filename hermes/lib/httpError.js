/* jshint node:true */
module.exports = HttpError;

var util  = require("util");

/**
 * Generic HTTP Error
 */
function HttpError(msg, statusCode) {
	Error.call(this, msg);
	Error.captureStackTrace(this, this);
	this.statusCode = statusCode || 500; // Internal-Server-Error
	this.message = msg || 'Error';
	if (this.message.match(/^(<html>|<!DOCTYPE html>)/i)) {
		this.contentType = "text/html";
	} else {
		this.contentType = "text/plain";
	}
}

util.inherits(HttpError, Error);

HttpError.prototype.name = "HTTP Error";


