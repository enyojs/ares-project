/**
 * ares namespace
 */
var ares = {
	/**
	 * Deep-clone given object
	 * @param {Object} obj object to clone
	 * @private
	 */
	clone: function(obj) {
		return ares.extend(undefined, obj);
	},
	/**
	 * Extend destination object using source object (deep)
	 * @param {Object} dst destination object
	 * @param {Object} src source object
	 * @private
	 */
	extend: function(dst, src) {
		if (dst === undefined) {
			if (!src) {
				return src;
			}
			dst = (src instanceof Array) ? [] : {};
		}
		for (var i in src) {
			if (typeof src[i] == "object") {
				dst[i] = ares.extend(dst[i], src[i]);
			} else {
				dst[i] = src[i];
			}
		}
		return dst;
	},
	/**
	 * Decode an 'application/x-www-urlencoded' string into an {Object}
	 * 
	 * @param {String} s the string to parse
	 * @return {Object} the decoded form
	 * @see ares#encodeWebForm
	 */
	decodeWebForm: function(s) {
		var form = {};
		var kvs = s.split('&');
		enyo.forEach(kvs, function(kv) {
			try {
				var tk = kv.split('=');
				form[decodeURIComponent(tk[0])] = decodeURIComponent(tk[1]);
			} catch (e) {
				enyo.log("skipping key-value: '" + kv + "'");
			}
		});
		return form;
	},
	/**
	 * Encode an {Object} into a 'application/x-www-urlencoded' string
	 * 
	 * The resulting string can be used as a qurey string.  Any
	 * non-{String} sub-property of the input object is ignored.
	 * 
	 * @param {Object} obj
	 * @return {String} the 'application/x-www-urlencoded' string
	 * @see ares#decodeWebForm
	 */
	encodeWebForm: function(obj) {
		var query = "";
		enyo.forEach(enyo.keys(obj), function(key) {
			if (typeof obj[key] === 'string') {
				query += key + '=' + encodeURIComponent(obj[key]) + '&';
			} else {
				enyo.log("skipping key: '" + key + "'");
			}
		}, this);
		query += "oauth_version=1.0";
		return query;
	}
};
