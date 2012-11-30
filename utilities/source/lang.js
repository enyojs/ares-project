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
	}
};
