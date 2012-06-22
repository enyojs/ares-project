/**
 * error - Error callback binding helper
 * @param  {function} catch callback generater with bound catch callback
 * @return {function}
 */

function error (handler) {
	return function() {
		var args = Array.prototype.slice.call(arguments);
		if (typeof args[args.length-1] === 'function') {
			var cb =  args.pop();
		}

		return function(err) {
			if (err) {throw err}//return handler.apply(null, [err].concat(args))

			if (cb) return cb.apply(this, Array.prototype.slice.call(arguments,1));
		}
	}
}

module.exports = error