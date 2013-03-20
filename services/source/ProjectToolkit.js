enyo.kind({
	name: "ProjectToolkit",
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
		var self = this;

		if (this.debug) this.log("config:", this.config, "+", inConfig);
		this.config = ares.extend(this.config, inConfig);
		if (this.debug) this.log("=> config:", this.config);

		if (this.config.origin && this.config.pathname) {
			this.url = this.config.origin + this.config.pathname;
			if (this.debug) this.log("url:", this.url);
		}

		// Populate the repositories on nodejs
		for(var repoId in inConfig.projectTemplateRepositories) {
			var repository = inConfig.projectTemplateRepositories[repoId];
			repository.id = repoId;
			this.createRepo(repository);		// TODO: handle the answer
		}
	},
	/**
	 * @return {Object} the configuration this service was configured by
	 */
	getConfig: function() {
		return this.config;
	},
	getTemplates: function() {
		if (this.debug) this.log();

		var req = new enyo.Ajax({
			url: this.url + '/templates'
		});
		return req.go();
	},
	generate: function(templateId, options) {
		if (this.debug) this.log();

		var data = "templateId=" + encodeURIComponent(templateId);
		data +=	("&options=" + encodeURIComponent(JSON.stringify(options)));

		var userreq = new enyo.Async();

		var req = new enyo.Ajax({
			url: this.url + '/generate',
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
	},
	createRepo: function(repo) {
		if (this.debug) this.log();
		var data = "url=" + encodeURIComponent(repo.url);

		var req = new enyo.Ajax({
			url: this.url + '/template-repos/' + repo.id,
			method: 'POST',
			postBody: data
		});
		return req.go();
	}
});