/*global ilib */
var AresI18n = {};

AresI18n.setBundle = function(bundle, msg, params) {
	var resolveString = function(string) {
		var str;
		if (typeof(string) === 'string') {
			str = bundle.getString(string);
		} else if (typeof(string) === 'object') {
			if (typeof(string.key) !== 'undefined' && typeof(string.value) !== 'undefined') {
				str = bundle.getString(string.value, string.key);
			} else {
				throw "Parameter 'string' is not well defined.";
			}
		} else {
			throw "Parameter 'string' is not an object.";
		}
		return str.toString();
	};

	var stringResolved = resolveString(msg);
	if (params) {
		var template = new ilib.String(stringResolved);
		return template.format(params);
	} 

	return stringResolved;
};

AresI18n.setLocale = function (spec, path, bundle) {
	return new ilib.ResBundle({
		locale: new ilib.Locale(spec),
		type: "html",
		name: "strings",
		sync: true,
		lengthen: true, // if pseudo-localizing, this tells it to lengthen strings
		loadParams: {
			root: path
		}
	});
};
