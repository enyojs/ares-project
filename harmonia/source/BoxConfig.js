
// var Api = "uxr6ab2ge57318sm3mgbv5e0ntmji52k";
 enyo.kind({
	name: "Box",
	kind: "FittableRows",
	
	// private members
	debug: false,
	requestTokenUrl:	"https://www.box.com/api/1.0/rest?action=get_auth_token&api_key=",
//	authorizeUrl:		"",
//	accessTokenUrl:		"",
	accountInfoUrl:		"https://www.box.com/api/2.0/users/me",
	
	// public members
	published: {
		serviceId: "",		// from ide.json
		serviceName: "",	// from ide.json
		auth: {}
	},
	
	// emitted events
	events: {
		onServerChange: "",
		onError: "",
		onStartWaiting: "",
		onStopWaiting: ""
	},
	components: [
		{kind: "Ares.Groupbox", components: [
			{kind: "onyx.GroupboxHeader", name: "serviceName"},
			{components: [
				{content: "User Name: ", kind: "Ares.GroupBoxItemKey"},
				{name: "username", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: "Email: ", kind: "Ares.GroupBoxItemKey"},
				{name: "email", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: "Quota (Max):", kind: "Ares.GroupBoxItemKey"},
				{name: "quota", kind: "Ares.GroupBoxItemValue"}
			]},
			{components: [
				{content: "Used:", kind: "Ares.GroupBoxItemKey"},
				{name: "normal", kind: "Ares.GroupBoxItemValue"}
			]},

			{kind: "FittableColumns", components: [
				{name: "renewBtn", kind: "onyx.Button", content: "Renew account", disabled: false, ontap: "renew"},
				{name: "checkBtn", kind: "onyx.Button", content: "Check", disabled: false, ontap: "tokenAction"}
			]},
			{name: "footnote"},
		]},
	],
	
	create: function() {
		this.inherited(arguments);
		//this.apikey = "uxr6ab2ge57318sm3mgbv5e0ntmji52k";  //obtain from Box Platform Developers Page
		//console.log(this.$.auth_token);
		if (this.debug) this.log("title:", this.title);
		this.$.serviceName.setContent(this.serviceName);
		this.auth = this.auth || {};
		this.auth.headers = this.auth.headers || {};
		if (this.auth.headers.authorization) {
			this.$.checkBtn.setDisabled(false);
		}		
		this.waitAccountInfo();
		//console.log(this.auth.apikey);
	},
	
	render: function() {
		if (ares.isPopupAllowed()) {
			this.$.footnote.setContent("");
		} else {
			this.$.footnote.setContent("You need to accept Box popup when asked...");
		}
		this.inherited(arguments);
	},
	
	check: function() {
		var self = this;
		// Disable [Check] button during async processing...
		this.$.checkBtn.setDisabled(true);
		async.series([
			this.waitAccountInfo.bind(this),
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
			this.authAction.bind(this),			
			this.authorize.bind(this),		
		//	this.getRequestToken.bind(this),
			this.getAccessToken.bind(this),
		//	this.saveAccessToken.bind(this),
			this.getAccountInfo.bind(this),
			this.displayAccountInfo.bind(this)
		], function(err, results) {
			enyo.log("BoxAuthConfig.renew: err:", err, "results:", results);
			self.doStopWaiting();
			// ... and re-enable it after success of failure.
			self.$.renewBtn.setDisabled(false);
			if (err) {
				self.doError({
					msg: "Unable to renew Box Account tokens",
					details: err.toString()
				});
			}
		});
	},
	

	authAction: function(next) {
		//this.$.output.addContent("Requesting tokens...<br/>");
		var request = new enyo.Ajax({
		url: "https://www.box.com/api/1.0/rest?action=get_ticket&api_key=" + this.auth.apikey,
		handleAs: "xml"
		});
		request.response(this, function(inSender, inGoodies) {
		console.log(inGoodies);

		xmlDoc = inGoodies.childNodes[0].childNodes[1].textContent;
		if (xmlDoc) {
			this.auth_token = xmlDoc;
			next();
			} else {
				this.$.output.addContent("failed" + inGoodies);
			}
		});
		request.go(/*{user: "user", password: "password"}*/);		
	},
	
	authorize: function(next) {
		//this.doStartWaiting({msg: "Box: waiting for user's authorization..."});
	
		var url = "https://www.box.com/api/1.0/auth/" + this.auth_token;
		var popup = window.open(url,
					"Box Authentication",
					"resizeable=1,width=1024, height=600");
		// Check 20s that the popup is closed... otherwise fails
		var self = this,
		delay = 20,
		timer = setInterval(function() {
			if(popup.closed) {
				clearInterval(timer);
				enyo.log("BoxAuthConfig.waitAuthorization: Box popup closed");
				//this.tokenAction();
				next();
			} else if (!--delay) {
				clearInterval(timer);
				enyo.log("BoxAuthConfig.waitAuthorization: failure: User did not accept or close the authorization window");
				popup.close();
				next(new Error("Box Authorization window did not close"));
			} else {
			//	self.doStartWaiting({msg: "Box: waiting for the accessToken (" + delay + "s left)..."});
			}
		}, 1000);
		
	},

	getAccessToken: function(next) {
		console.log("token");
		console.log(this.auth.apikey);
		console.log(this.auth_token);
		//https://www.box.com/api/1.0/rest?action=get_auth_token&api_key={your api key}&ticket={your ticket}

		new enyo.Ajax({ url: "https://www.box.com/api/1.0/rest?action=get_auth_token&api_key=" + this.auth.apikey + "&ticket="+ this.auth_token,
			handleAs: "xml"
		})

			.go(/*{token: this.auth_token, secret: this.auth_secret}*/)
			.response(this, function(inSender, inGoodies) {
			xmlDoc = inGoodies.childNodes[0].childNodes[1].textContent;
	
			if (xmlDoc) {
				this.auth_token = xmlDoc;
				next();
			}
		});
	},
	
	saveAccessToken: function(next) {
		var event = {
			serviceId: this.serviceId,
			auth: {
				//accessToken: this.auth.accessToken,
				apikey:  this.auth.apikey,

				//accessTokenSecret: this.auth.accessTokenSecret,
				authToken: this.auth.auth_token
				
			//	uid: this.auth.uid,
			//	headers: ares.clone(this.auth.headers)
			}
		};
		this.log("event:", event);
		this.doUpdateAuth(event);
		delete this.auth.requestToken;
		delete this.auth.requestTokenSecret;
		this.$.checkBtn.setDisabled(false);
		next();
	},
	
	getAccountInfo: function(next) {
		this.doStartWaiting({msg: "Box: waiting for user's account information..."});
		var reqOptions = {
			url: this.accountInfoUrl,
			method: 'GET',
			handleAs: 'json',
			cacheBust: false, // cacheBust query parameter not accepted by Dropbox
			headers: {"Authorization": "BoxAuth api_key=" + this.auth.apikey + "&auth_token="+ this.auth_token},
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
				errMsg = JSON.parse(inSender.xhrResponse.body).error; 
			} catch(e) {
				errMsg = inError;
			}
			this.log("errMsg:", errMsg);
//			next(new Error(errMsg));
		});
		req.go();
	},	
	waitAccountInfo: function(next) {
		this.$.username.setContent("...");
		this.$.email.setContent("...");
	//	this.$.country.setContent("...");
		this.$.quota.setContent("...");
		this.$.normal.setContent("...");
	//	this.$.shared.setContent("...");
		if (next) next();
	},	
	displayAccountInfo: function(next) {
		this.log("accountInfo:", this.accountInfo);
		this.$.username.setContent(this.accountInfo.name);
		this.$.email.setContent(this.accountInfo.login);
		var quota = Math.floor(this.accountInfo.space_amount / (1024*1024)) + " MB";
		this.$.quota.setContent(quota);
		var used = Math.floor(this.accountInfo.space_used / (1024*1024)) + " MB";
		this.$.normal.setContent(used);
	
		if (next) next();
	},

});

