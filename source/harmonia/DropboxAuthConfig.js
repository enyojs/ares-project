/*global async, ares, ilibHarmonia */
/**
 * @see https://www.dropbox.com/developers/reference/api
 * @see https://www.dropbox.com/developers/blog/20
 */
enyo.kind({
	name: "DropboxAuthConfig",
	kind: "FittableRows",

	// private members
	debug: false,
	requestTokenUrl:	"https://api.dropbox.com/1/oauth/request_token",
	authorizeUrl:		"https://www.dropbox.com/1/oauth/authorize",
	accessTokenUrl:		"https://api.dropbox.com/1/oauth/access_token",
	accountInfoUrl:		"/res/services/dropbox",

	requestToken: "",		// from dropbox
	requestTokenSecret: "",		// from dropbox
	uid: "",			// from dropbox

	// public members
	published: {
		serviceId: "",		// from ide.json
		serviceName: "",	// from ide.json
		auth: {}
	},

	// emitted events
	events: {
		onUpdateAuth: "",
		onError: "",
		onStartWaiting: "",
		onStopWaiting: ""
	},

	// static UI elements
	components: [
		{kind: "Ares.Groupbox", components: [
			{kind: "onyx.GroupboxHeader", name: "serviceName"},
			{components: [
				{content: ilibHarmonia("User Name:"), kind: "Ares.GroupBoxItemKey"},
				{name: "name", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: ilibHarmonia("Email:"), kind: "Ares.GroupBoxItemKey"},
				{name: "email", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: ilibHarmonia("Country Code:"), kind: "Ares.GroupBoxItemKey"},
				{name: "countryCode", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: ilibHarmonia("Quota (Max):"), kind: "Ares.GroupBoxItemKey"},
				{name: "quota", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: ilibHarmonia("Usage (Private):"), kind: "Ares.GroupBoxItemKey"},
				{name: "privateBytes", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: ilibHarmonia("Usage (Shared):"), kind: "Ares.GroupBoxItemKey"},
				{name: "sharedBytes", kind: "Ares.GroupBoxItemValue"}
			]}
		]},
		{kind: "FittableColumns", components: [
			{name: "renewBtn", kind: "onyx.Button", content: ilibHarmonia("Renew"), disabled: false, ontap: "renew"},
			{name: "checkBtn", kind: "onyx.Button", content: ilibHarmonia("Check"), disabled: true, ontap: "check"}
		]},
		{name: "footnote"}
	],

	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.trace("title:", this.title);
		this.$.serviceName.setContent(this.serviceName);
		this.auth = this.auth || {};
		this.auth.headers = this.auth.headers || {};
		if (this.auth.headers.authorization) {
			this.$.checkBtn.setDisabled(false);
		}
		this.waitAccountInfo();
	},
	render: function() {
		if (ares.isPopupAllowed()) {
			this.$.footnote.setContent("");
		} else {
			this.$.footnote.setContent(ilibHarmonia("You need to accept Dropbox popup when asked..."));
		}
		this.inherited(arguments);
	},
	check: function() {
		var self = this;
		// Disable [Check] button during async processing...
		this.$.checkBtn.setDisabled(true);
		async.series([
			this.waitAccountInfo.bind(this),
			this.authenticate.bind(this),
			this.getAccountInfo.bind(this),
			this.displayAccountInfo.bind(this)
		], function(err, results) {
			enyo.log("DropboxAuthConfig.check: err:", err, "results:", results);
			self.doStopWaiting();
			// ... and re-enable it after success of failure.
			self.$.checkBtn.setDisabled(false);
			if (err) {
				self.doError({
					msg: "Unable to check Dropbox Account",
					details: err.toString()
				});
			}
		});
	},
	renew: function() {
		var self = this;
		// Disable [Renew] button during async processing...
		this.$.renewBtn.setDisabled(true);
		async.series([
			this.waitAccountInfo.bind(this),
			this.getRequestToken.bind(this),
			this.authorize.bind(this),
			this.getAccessToken.bind(this),
			this.saveAccessToken.bind(this),
			this.getAccountInfo.bind(this),
			this.displayAccountInfo.bind(this)
		], function(err, results) {
			enyo.log("DropboxAuthConfig.renew: err:", err, "results:", results);
			self.doStopWaiting();
			// ... and re-enable it after success of failure.
			self.$.renewBtn.setDisabled(false);
			if (err) {
				self.doError({
					msg: "Unable to renew Dropbox Account tokens",
					details: err.toString()
				});
			}
		});
	},
	//* @private
	getOauthTimestamp: function() {
		return Date.now() /1000 |0;
	},
	//* @private
	getOauthNonce: function() {
		// 24-characters random string (same method as
		// multipart/form-data separator)
		var nonce = "";
		for (var i = 0; i < 24; i++) {
			nonce += Math.floor(Math.random() * 10).toString(16);
		}
		return nonce;
	},
	makeOAuthRequestTokenObject: function(appKey, appSecret) {
		var obj = {
			// http://oauth.net/core/1.0/#rfc.section.6.1.1
			oauth_signature_method: "PLAINTEXT",
			oauth_consumer_key: appKey,
			oauth_signature: appSecret + '&'
		};
		return obj;
	},
	makeOAuthHeaderObject: function(appKey, appSecret, token, tokenSecret) {
		var obj = {
			// http://oauth.net/core/1.0/#rfc.section.6.1.1
			oauth_signature_method: "PLAINTEXT",
			oauth_consumer_key: appKey,
			oauth_token: token,
			oauth_signature: appSecret + '&' + tokenSecret
		};
		return obj;
	},
	//* @private
	makeOAuthHeader: function(prefix, params) {
		var header = prefix + ' ', sep = ', ';
		header += 'oauth_version="1.0"';
		enyo.forEach(enyo.keys(params), function(key) {
			header += sep + key + '="' + params[key] + '"';
		}, this);
		this.log("header:", header);
		return header;
	},
	//* @private
	getRequestToken: function(next) {
		if (!this.auth.appKey || !this.auth.appSecret) {
			this.warn("Ares IDE mis-configuration: missing Dropbox AppKey and/or AppSecret in ide.json.  Get those values from https://www.dropbox.com/developers/apps");
			next(new Error("Ares is not configured as a Dropbox application: Contact your system administrator"));
			return;
		}
		this.doStartWaiting({msg: "Dropbox: waiting for request token..."});
		var reqOptions = {
			url: this.requestTokenUrl,
			method: 'POST',
			handleAs: 'text',
			cacheBust: false,
			headers: {
				'cache-control': false,
				Authorization: this.makeOAuthHeader('OAuth', this.makeOAuthRequestTokenObject(this.auth.appKey, this.auth.appSecret))
			}
		};
		this.log("options:", reqOptions);
		var req = new enyo.Ajax(reqOptions);
		req.response(this, function(inSender, inValue) {
			this.log("response:", inValue);
			var form = ares.decodeWebForm(inValue);
			this.log("form:", form);
			this.requestTokenSecret = form.oauth_token_secret;
			this.requestToken = form.oauth_token;
			this.uid = form.uid;
			next();
		});
		req.error(this, function(inSender, inError) {
			this.log("response:", inError);
			next(new Error(inError));
		});
		req.go();
	},
	// XXX better offload this popup sequence to a dedicated enyo Object
	authorize: function(next) {
		this.doStartWaiting({msg: "Dropbox: waiting for user's authorization..."});
		var url = this.authorizeUrl + '?oauth_token=' + encodeURIComponent(this.requestToken);
		var popup = window.open(url,
					"Dropbox Authentication",
					"resizeable=1,width=1024, height=600");
		// Check 20s that the popup is closed... otherwise fails
		var self = this,
		    delay = 20,
		    timer = setInterval(function() {
			if(popup.closed) {
				clearInterval(timer);
				enyo.log("DropboxAuthConfig.waitAuthorization: Dropbox popup closed");
				next();
			} else if (!--delay) {
				clearInterval(timer);
				enyo.log("DropboxAuthConfig.waitAuthorization: failure: User did not accept or close the authorization window");
				popup.close();
				next(new Error("Dropbbox Authorization window did not close"));
			} else {
				self.doStartWaiting({msg: "Dropbox: waiting for the accessToken (" + delay + "s left)..."});
			}
		}, 1000);
	},
	getAccessToken: function(next) {
		this.doStartWaiting({msg: "Dropbox: waiting for the accessToken..."});
		var reqOptions = {
			url: this.accessTokenUrl,
			method: 'POST',
			handleAs: 'text',
			cacheBust: false,
			headers: {
				'cache-control': false,
				Authorization: this.makeOAuthHeader('OAuth', this.makeOAuthHeaderObject(this.auth.appKey, this.auth.appSecret, this.requestToken, this.requestTokenSecret))
			}
		};
		this.log("options:", reqOptions);
		var req = new enyo.Ajax(reqOptions);
		req.response(this, function(inSender, inValue) {
			this.log("response:", inValue);
			var form = ares.decodeWebForm(inValue);
			this.log("form:", form);
			this.auth.accessTokenSecret = form.oauth_token_secret;
			this.auth.accessToken = form.oauth_token;
			this.auth.uid = form.uid;
			this.auth.headers.authorization = this.makeOAuthHeader('OAuth', this.makeOAuthHeaderObject(this.auth.appKey, this.auth.appSecret, this.auth.accessToken, this.auth.accessTokenSecret));
			next();
		});
		req.error(this, function(inSender, inError) {
			this.log("response:", inError);
			next(new Error(inError));
		});
		req.go();
	},
	saveAccessToken: function(next) {
		var event = {
			serviceId: this.serviceId,
			auth: {
				accessToken: this.auth.accessToken,
				accessTokenSecret: this.auth.accessTokenSecret,
				uid: this.auth.uid,
				headers: ares.clone(this.auth.headers)
			}
		};
		this.log("event:", event);
		this.doUpdateAuth(event);
		delete this.auth.requestToken;
		delete this.auth.requestTokenSecret;
		this.$.checkBtn.setDisabled(false);
		next();
	},
	/**
	 * Server round-trip to record the applications credentials as
	 * a server cookie.  This is the only step where the
	 * application key is exchanged in clear text between the
	 * browser client & the ARES server.
	 */
	authenticate: function(next) {
		var reqOptions = {
			url: this.accountInfoUrl,
			method: 'POST',
			handleAs: 'json'
		};
		this.log("options:", reqOptions);
		var req = new enyo.Ajax(reqOptions);
		req.response(this, function(inSender, inValue) {
			this.log("response:", inValue);
			next();
		});
		req.error(this, function(inSender, inError) {
			var errMsg;
			try {
				errMsg = enyo.json.parse(inSender.xhrResponse.body).error; 
			} catch(e) {
				errMsg = inError;
			}
			this.log("errMsg:", errMsg);
			next(new Error(errMsg));
		});
		req.go({auth: enyo.json.stringify({
			appKey: this.auth.appKey,
			appSecret: this.auth.appSecret,
			uid: this.auth.uid,
			accessToken: this.auth.accessToken,
			accessTokenSecret: this.auth.accessTokenSecret
		})});
	},
	getAccountInfo: function(next) {
		this.doStartWaiting({msg: "Dropbox: waiting for user's account information..."});
		var reqOptions = {
			url: this.accountInfoUrl,
			method: 'GET',
			handleAs: 'json'
		};
		this.log("options:", reqOptions);
		var req = new enyo.Ajax(reqOptions);
		req.response(this, function(inSender, inValue) {
			this.log("response:", inValue);
			this.accountInfo = inValue;
			next();
		});
		req.error(this, function(inSender, inError) {
			var errMsg;
			try {
				errMsg = enyo.json.parse(inSender.xhrResponse.body).error; 
			} catch(e) {
				errMsg = inError;
			}
			this.log("errMsg:", errMsg);
			next(new Error(errMsg));
		});
		req.go({auth: enyo.json.stringify({
			appKey: this.auth.appKey,
			appSecret: this.auth.appSecret,
			uid: this.auth.uid,
			accessToken: this.auth.accessToken,
			accessTokenSecret: this.auth.accessTokenSecret
		})});
	},
	waitAccountInfo: function(next) {
		this.$.name.setContent("...");
		this.$.email.setContent("...");
		this.$.countryCode.setContent("...");
		this.$.quota.setContent("...");
		this.$.privateBytes.setContent("...");
		this.$.sharedBytes.setContent("...");
		if (next) {
			next();
		}
	},
	displayAccountInfo: function(next) {
		this.log("accountInfo:", this.accountInfo);
		this.$.name.setContent(this.accountInfo.name);
		this.$.email.setContent(this.accountInfo.email);
		this.$.countryCode.setContent(this.accountInfo.countryCode);
		var quota = Math.floor(this.accountInfo.quota / (1024*1024)) + " MB";
		this.$.quota.setContent(quota);
		var privateBytes = Math.floor(this.accountInfo.privateBytes / (1024*1024)) + " MB";
		this.$.privateBytes.setContent(privateBytes);
		var sharedBytes = Math.floor(this.accountInfo.sharedBytes / (1024*1024)) + " MB";
		this.$.sharedBytes.setContent(sharedBytes);
		if (next) {
			next();
		}
	}
});
