/*global enyo */

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
	 * Extract the filename of the given path
	 * @param {String} the path to extract the basename from
	 * @return the path basename
	 */
	basename: function(path) {
		return path.replace(/\\/g,'/').replace( /.*\//, '' );
	},
	/**
	 * Extract the containing folder of the given path
	 * @param {String} the path to extract the dirname from
	 * @return the path dirname
	 */
	dirname: function (path) {
		return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
	},

	/**
	 * Throw an error if cb is not a function
	 * @param {Function} cb
	 * @throws Will throw an error if cb is not a function
	 */
	assertCb: function (cb) {
		if (typeof cb !== 'function') {
			throw new Error("Assert callback failed: found '" + cb + "' instead of a function");
		}
	},

	/**
	 * noNext does nothing. To be used to pass an empty callback
	 */
	noNext: function() {
		/* does nothing */
	},

	/** @private */
    _getProp: function(parts, create, context) {
        var obj = context || window;
        for(var i=0, p; obj && (p=parts[i]); i++){
            obj = (p in obj ? obj[p] : (create ? obj[p]={} : undefined));
        }
        return obj;
    },

	/**
     Sets object _name_ to _value_. _name_ may use dot notation, and
     intermediate objects are created as necessary.

     // set foo.bar.baz to 3; if foo or foo.bar do not exist, they are created
     enyo.setObject("foo.bar.baz", 3);

     Optionally, _name_ may be relative to object _context_.

     // create foo.zot and set foo.zot.zap to null
     enyo.setObject("zot.zap", null, foo);
     */
    setObject: function(name, value, context) {
        var parts=name.split("."), p=parts.pop(), obj=ares._getProp(parts, true, context);
        return obj && p ? (obj[p]=value) : undefined;
    },

    /**
     Gets object _name_. _name_ may use dot notation. Intermediate objects
     are created if the _create_ argument is truthy.

     // get the value of foo.bar, or undefined if foo doesn't exist
     var value = enyo.getObject("foo.bar");

     // get the value of foo.bar; if foo.bar doesn't exist,
     // it's assigned an empty object, which is then returned
     var value = enyo.getObject("foo.bar", true);

     Optionally, _name_ may be relative to object _context_.

     // get the value of foo.zot.zap, or undefined if foo.zot doesn't exist
     var value = enyo.getObject("zot.zap", false, foo);
     */
    getObject: function(name, create, context) {
        return ares._getProp(name.split("."), create, context);
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
		} else {
			// pop-ups are NOT blocked
			testWindow.close();
			return false;
		}
	},
	/**
	 * Setup object.trace function to object.log
	 * if object.debug is true.
	 * Otherwise object.trace is set to a function
	 * which logs nothing.
	 * @param  {Object} the object to alter
	 * @public
	 */
	setupTraceLogger: function(object) {
		if ( ! object) {
			enyo.error("Cannot setup trace logger of ", object);
			return;
		}
		object.trace = (object.debug === true ? object.log : _nolog);

		function _nolog() {
			// Don't log anything
		}
	}
};
