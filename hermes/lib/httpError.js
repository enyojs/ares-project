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
}

util.inherits(HttpError, Error);

HttpError.prototype.name = "HTTP Error";


