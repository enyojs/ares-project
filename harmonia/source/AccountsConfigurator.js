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
		]}
	],

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
					this.selectedAuthConfig = this.$.authPanel.$[serviceAuthName];
					this.selectedAuthConfig.render();
				} else {
					throw new Error("Unhandled authentication type of service:" + service.config.id);
				}
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
	 * @private
	 */
	handleUpdateAuth: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		ServiceRegistry.instance.setConfig(inEvent.serviceId, {auth: inEvent.auth});
		this.dismiss();
	},
	/**
	 * @public
	 */
	dismiss: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.hide();
	}
});
