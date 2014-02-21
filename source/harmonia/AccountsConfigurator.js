/* global ServiceRegistry, ares, ilibHarmonia */
enyo.kind({
	name: "AccountsConfigurator",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	debug: false,
	classes:"ares-classic-popup",
	components: [
		{tag: "div", classes:"title", content: ilibHarmonia("Accounts")},
		{kind: "FittableRows", classes:"ares-phonegap-config", fit: true, components: [
			{kind: "FittableColumns", fit: true, components: [
				{kind: "ProviderList", name: "accountsList", selector: ["auth"], onSelectProvider: "handleSelectProvider"},
				{name: "authPanel", classes: "ares_harmonia_authPanel ares_harmonia_providerItems"}
			], onUpdateAuth: "handleUpdateAuth"},
		]},
		{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
			{kind: "onyx.Button", content: ilibHarmonia("Done"), ontap: "dismiss"}
		]},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "", details: "", autoDismiss: false, modal: true},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, classes: "ares-waitpopup", components: [
			{kind: "onyx.Spinner", classes: "onyx-dark"},
			{name: "waitPopupMsg", content: ilibHarmonia("Ongoing...")}
		]}
	],
	events: {
		onRegisterMe: ""
	},

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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.doRegisterMe({name:"accountsConfigurator", reference:this});
		this.trace("");
	},
	/**
	 * @private
	 */
	handleSelectProvider: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var service = inEvent.service;
		if (service && service.config && service.config.auth) {
			this.trace("selected service:", service.config.id);
			var serviceAuthName = service.config.id + "AuthConfig";
			if (this.selectedAuthConfig) {
				this.selectedAuthConfig.hide();
				this.selectedAuthConfig = undefined;
			}
			// Cache created AuthConfig in the AuthPanel
			this.selectedAuthConfig = this.$.authPanel.$[serviceAuthName];
			if (!this.selectedAuthConfig) {
				if (service.config.auth.type === 'plugin') {
					this.trace("creating 'custom' auth form");
					var provider, authFormKind;
					provider = ServiceRegistry.instance.resolveServiceId(service.config.id);
					authFormKind = provider.getAuthConfigKind();
					this.trace("auth form using kind:", authFormKind);
					this.$.authPanel.createComponent({
						kind: authFormKind,
						name: serviceAuthName,
						serviceId: service.config.id,
						serviceName: service.config.name,
						username: service.config.auth.username,
						password: service.config.auth.password
					});
				} else if (service.config.auth.type === 'basic') {
					this.trace("creating 'basic' auth form");
					this.$.authPanel.createComponent({
						kind: "BasicAuthConfig",
						name: serviceAuthName,
						serviceId: service.config.id,
						serviceName: service.config.name,
						username: service.config.auth.username,
						password: service.config.auth.password
					});
				} else if (service.config.auth.type === 'phonegap') {
					this.trace("creating 'phonegap' auth form");
					this.$.authPanel.createComponent({
						kind: "PhonegapAuthConfig",
						name: serviceAuthName,
						serviceId: service.config.id,
						serviceName: service.config.name,
						username: service.config.auth.username,
						password: service.config.auth.password
					});
				} else if (service.config.auth.type === 'dropbox') {
					this.trace("creating 'dropbox' auth form");
					this.$.authPanel.createComponent({
						kind: "DropboxAuthConfig",
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
		this.trace("sender:", inSender, ", event:", inEvent);
		this.hide();
	},
	showError: function(inSender, inEvent) {
		this.trace("event:", inEvent, "from sender:", inSender);
		this.$.errorPopup.raise(inEvent.msg, inEvent.details);
		return true; //Stop event propagation
	},
	startWaiting: function(inSender, inEvent) {
		this.trace("event:", inEvent, "from sender:", inSender);
		this.$.waitPopupMsg.setContent(inEvent.msg);
		this.$.waitPopup.show();
		return true; //Stop event propagation
	},
	stopWaiting: function(inSender, inEvent) {
		this.trace("event:", inEvent, "from sender:", inSender);
		this.$.waitPopupMsg.setContent("");
		this.$.waitPopup.hide();
		return true; //Stop event propagation
	}
});
