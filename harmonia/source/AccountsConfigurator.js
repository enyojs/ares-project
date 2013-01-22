enyo.kind({
	name: "AccountsConfigurator",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	debug: false,

	classes: "enyo-popup onyx-light",

	components: [
		{kind: "FittableRows", style: "height: 400px; width: 600px", fit: true, components: [
			{content: "Accounts", classes:"onyx-toolbar"},
			{kind: "FittableColumns", fit: true, components: [
				{kind: "ProviderList", name: "accountsList", propertiesJSON: '["type","auth"]', onSelectProvider: "handleSelectProvider"},
				{name: "authPanel", classes: "ares_harmonia_authPanel"}
			], onUpdateAuth: "handleUpdateAuth"},
			{kind: "onyx.Button", content: "Dismiss", ontap: "dismiss"}
		]},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "", details: "", autoDismiss: false, modal: true},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, classes: "ares-waitpopup", components: [
			{kind: "onyx.Spinner", classes: "onyx-dark"},
			{name: "waitPopupMsg", content: "Ongoing..."}
		]}
	],

	handlers: {
		onError: "showError",
		onStartWaiting: "startWaiting",
		onStopWaiting: "stopWaiting"
	},

	//* @private
	selectedAuthConfig: undefined,

	/**
	 * @protected
	 */
	create: function() {
		this.inherited(arguments);
		if (this.debug) this.log("");
	},
	/**
	 * @private
	 */
	handleSelectProvider: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		var service = inEvent.service;
		if (service && service.config && service.config.auth) {
			if (this.debug) this.log("selected service:", service.config.id);
			var serviceAuthName = service.config.id + "AuthConfig";
			if (this.selectedAuthConfig) {
				this.selectedAuthConfig.hide();
				this.selectedAuthConfig = undefined;
			}
			// Cache created AuthConfig in the AuthPanel
			this.selectedAuthConfig = this.$.authPanel.$[serviceAuthName];
			if (!this.selectedAuthConfig) {
				// Basic-Authentication
				if (service.config.auth.type === 'basic') {
					if (this.debug) this.log("creating 'basic' auth form");
					this.$.authPanel.createComponent({
						kind: "BasicAuthConfig",
						name: serviceAuthName,
						serviceId: service.config.id,
						serviceName: service.config.name,
						username: service.config.auth.username,
						password: service.config.auth.password
					});
				} else if (service.config.auth.type === 'phonegap') {
					if (this.debug) this.log("creating 'phonegap' auth form");
					this.$.authPanel.createComponent({
						kind: "PhonegapAuthConfig",
						name: serviceAuthName,
						serviceId: service.config.id,
						serviceName: service.config.name,
						username: service.config.auth.username,
						password: service.config.auth.password
					});
				} else if (service.config.auth.type === 'dropbox') {
					if (this.debug) this.log("creating 'dropbox' auth form");
					this.$.authPanel.createComponent({
						kind: "DropboxAuthConfig",
						name: serviceAuthName,
						serviceId: service.config.id,
						serviceName: service.config.name,
						auth: ares.clone(service.config.auth)
					});
				} else if (service.config.auth.type === 'box') {
					if (this.debug) this.log("creating 'box' auth form");
					this.$.authPanel.createComponent({
						kind: "Box",
						name: serviceAuthName,
						serviceId: service.config.id,
						serviceName: service.config.name,
						auth: ares.clone(service.config.auth)
					});
				} else {
					throw new Error("Unhandled authentication type of service:" + service.config.id);
				}
				this.selectedAuthConfig = this.$.authPanel.$[serviceAuthName];
				this.selectedAuthConfig.render();
			}
			if (this.selectedAuthConfig) {
				this.selectedAuthConfig.show();
			}
		} else if (inSender.selected === -1) {
			// deselection...
			if (this.selectedAuthConfig) {
				this.selectedAuthConfig.hide();
			}

		} else {
			this.warn("provider (" + inSender.selected + ") selected by sender (" + inSender + ") without giving a suitable service", service);
		}
		return true; //Stop event propagation
	},
	/**
	 * @public
	 */
	dismiss: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.hide();
	},
	showError: function(inSender, inEvent) {
		if (this.debug) this.log("event:", inEvent, "from sender:", inSender);
		this.$.errorPopup.raise(inEvent.msg, inEvent.details);
		return true; //Stop event propagation
	},
	startWaiting: function(inSender, inEvent) {
		if (this.debug) this.log("event:", inEvent, "from sender:", inSender);
		this.$.waitPopupMsg.setContent(inEvent.msg);
		this.$.waitPopup.show();
		return true; //Stop event propagation
	},
	stopWaiting: function(inSender, inEvent) {
		if (this.debug) this.log("event:", inEvent, "from sender:", inSender);
		this.$.waitPopupMsg.setContent("");
		this.$.waitPopup.hide();
		return true; //Stop event propagation
	}
});
