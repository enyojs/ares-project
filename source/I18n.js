/*global ilib */
/*
 * AresI18n is the entry point used to define global Ares translation bundles based on ilib library 
 * (http://www.jedlsoft.com/jedlsoft/ilib/jsdoc/) through enyo-ilib library wrapper.
 * Translation bundles must be defined in the main kinds related to the translation domain covered by the translation resopurces
 * Translation bundles must, then, be declared as global in each kind that will require translation from the related domains.
 * Translation bundles insure the translation of simple or parametrized entries.
 * AresI18n must be declared and find before any other kind in package.js file.
 * Translation bundle must be defined through a context binding:
 *    var translationBundle = AresI18n.resolve.bind(null, AresI18n.setBundle({locale}, {path_to_resources}));
 * Translations are simply resolved by calling the translation bundle:
 *    var simpleTranslation = translationBundle("Simple message");
 * or
 *    var parametrizedTranslation = translationBundle("Parametrized message with {param1} and {param2}", {param1: value1, param2: value2});
 */
var AresI18n = {};

var origin = window.location.origin || window.location.protocol + "//" + window.location.host; // Webkit/FF vs IE

var req = new enyo.Ajax({
	url: origin + '/res/language'
});
req.response(function(inSender, inData){
	if (inData.language) {
		enyo.log("Ares forced language:", inData.language);
		AresI18n.spec = inData.language;
	} else {
		AresI18n.spec = navigator.language;
	}
});
req.error(function(inSender, inError){
	enyo.log("inError", inError);
});
req.go();

(function() {
	/**
	 * _resolveString resolves the translation according to the locale for a specific entry
	 * 
	 * @param  {Object} bundle Translation bundle where the string entry has been defined
	 * @param  {String} string String entry to translate
	 * @returns {String} Related tranlated string
	 * @private
	 */
	var _resolveString = function(bundle, string) {
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

	/**
	 * resolve return the translation (parametrized or not) based on the related translation domain. 
	 * 
	 * @param {Object} bundle Translation bundle where the string entry has been defined
	 * @param {String} msg    String entry to translate
	 * @param {Object} params Key/Value parameters used to customize the thanslation
	 * @returns {String} Translated (and parametrized if required) string related to "msg" string entry
	 * @public
	 */
	AresI18n.resolve = function(bundle, msg, params) {
		var stringResolved = _resolveString(bundle, msg);
		if (params) {
			var template = new ilib.String(stringResolved);
			return template.format(params);
		} 

		return stringResolved;
	};

	/**
	 * setLocale defines a translation bundle based on a translation domain.
	 * 
	 * @param {String} spec   Specified locale code: en-US, fr-FR, ko-KR, en-CA...
	 * @param {String} path   Path to related translation resources folder entry (here translation resources are named strings.json files)
	 * @param {Object} bundle Translation bundle where the string entry has been defined
	 * @returns {Object} Translation bundle based on a specific translation domain according to the locale specified
	 * @public
	 */
	AresI18n.setBundle = function (path, bundle) {
		return new ilib.ResBundle({
			locale: new ilib.Locale(AresI18n.spec),
			type: "html",
			name: "strings",
			sync: true,
			lengthen: true, // if pseudo-localizing, this tells it to lengthen strings
			loadParams: {
				root: path
			}
		});
	};
})();
