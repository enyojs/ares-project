/*global enyo,ares,async*/

enyo.kind({
	name: "GenZip",
	kind: "enyo.Component",
	events: {
		onLoginFailed: "",
		onBuildStarted: ""
	},
	debug: false,
	/**
	 * @private
	 */
	create: function() {
		if (this.debug) this.log();
		this.inherited(arguments);
		this.config = {};
	},

	/**
	 * Set project toolkit base parameters.
	 *
	 * This method is not expected to be called by anyone else but
	 * {ServiceRegistry}.
	 * @param {Object} inConfig
	 * @see ServiceRegistry.js
	 */
	setConfig: function(inConfig) {
		if (this.debug) this.log("config:", this.config, "+", inConfig);
		this.config = ares.extend(this.config, inConfig);
		if (this.debug) this.log("=> config:", this.config);

		if (this.config.origin && this.config.pathname) {
			this.url = this.config.origin + this.config.pathname;
			if (this.debug) this.log("url:", this.url);
		}
	},

	/**
	 * @return {Object} the configuration this service was configured by
	 */
	getConfig: function() {
		return this.config;
	},

	/**
	 * List the available 'sourceId' of a given type.
	 * 
	 * @param {String} type in ['template', 'lib', 'webos-service', ...]
	 * @return {enyo.Async}
	 * @public
	 */
	getSources: function(type) {
		if (this.debug) this.log("type:", type);

		var req = new enyo.Ajax({
			url: this.url + '/config/sources'
		});
		return req.go({type: type});
	},

	/**
	 * Generate a new application or add new components to an existing application.
	 * 
	 * @param {Object} options
	 * @property options {Array} sourceIds in-order sequence of ZIP archives & files
	 * @property options {Boolean} overwrite true to overwrite existing folders & files (true by default)
	 * @property options {Object} substitutions
	 * @return {enyo.Async}
	 * @public
	 */
	generate: function(options) {
		var query = [];
		enyo.forEach(enyo.keys(options), function(key) {
			query.push(key + "=" + encodeURIComponent(enyo.json.stringify(options[key])));
		}, this);
		var data = query.join('&');
		if (this.debug) this.log("data:", data);

		var userreq = new enyo.Async();

		var req = new enyo.Ajax({
			url: this.url + '/op/generate',
			method: 'POST',
			handleAs: "text",
			postBody: data,
			mimeType: 'text/plain; charset=x-user-defined'
		});

		req.response(this, function(inSender, inData) {
			userreq.respond({ctype: req.xhrResponse.headers['x-content-type'], content: inData});
		});
		req.error(this, function(inSender, inError) {
			this.log("Unable to get the template files (" + inError + ")");
			userreq.fail(inError);
		});
		req.go();
		return userreq;
	}
});