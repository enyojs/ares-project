/**
 * ares namespace
 */
var ares = {
	/**
	 * Deep-clone given object
	 * @param {Object} obj object to clone
	 * @return the deep-cloned {Object}
	 * @private
	 */
	clone: function(obj) {
		return ares.extend(undefined, obj);
	},
	/**
	 * Extend destination object using source object (deep)
	 * @param {Object} dst destination object
	 * @param {Object} src source object
	 * @return the extended {Object}
	 * 
	 * This method directly operates on the given dst {Object},
	 * but it is important to assign the result of this method to
	 * dst (especially if dst was initially undefined).
	 * 
	 * @private
	 */
	extend: function(dst, src) {
		if (dst === undefined) {
			if (!src) {
				return src;
			}
			dst = enyo.isArray(src) ? [] : {};
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
	},
	/**
	 * Test whether the browser blocks browser popups for the current location
	 * 
	 * @return {true} if browser popups are allowed for the current {window.location}, false otherwise.
	 */
	isPopupAllowed: function() {
		var params = 'height=1,width=1,left=-100,top=-100,location=no,toolbar=no,menubar=no,scrollbars=no,resizable=no,directories=no,status=no';
		var testWindow = window.open("popupTest.htm", "popupTest", params);

		if ( !testWindow || 
		     testWindow.closed ||
		     (typeof testWindow.closed=='undefined') ||
		     (testWindow.outerHeight === 0) ||
		     (testWindow.outerWidth === 0)) {
			  // pop-ups ARE blocked
			  return true;
		  }
		else {
			// pop-ups are NOT blocked
			testWindow.close();
			return false;
		}
	}
};
