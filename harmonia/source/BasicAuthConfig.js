enyo.kind({
	name: "BasicAuthConfig",
	kind: "onyx.Groupbox",
	classes: "onyx-groupbox enyo-fill",

	// private members
	debug: false,

	// public members
	published: {
		serviceId: "",		// from ide.json
		serviceName: "",	// from ide.json
		username: "",
		password: ""
	},

	// emitted events
	events: {
		onUpdateAuth: ""
	},

	// static UI elements
	components: [
		{kind: "onyx.GroupboxHeader", name: "serviceName"},
		{content: "User Name:"},
		{kind: "onyx.InputDecorator", components: [
			{name:"username", kind: "onyx.Input", placeholder: "login..."}
		]},
		{content: "Password:"},
		{kind: "onyx.InputDecorator", components: [
			{name:"password", kind: "onyx.Input", placeholder: "password...", type: "password"}
		]},
		{kind: "onyx.Button", content: "Save", ontap: "save"}
	],

	/**
	 * @protected
	 */
	create: function() {
		this.inherited(arguments);
		if (this.debug) this.log("title:", this.title, "username:", this.username, "password:", 'XXX' /*this.password*/);
		this.$.serviceName.setContent(this.serviceName);
		this.usernameChanged();
		this.passwordChanged();
	},
	/**
	 * @private
	 */
	usernameChanged: function(old) {
		this.$.username.setValue(this.username);
	},
	/**
	 * @private
	 */
	passwordChanged: function(old) {
		this.$.password.setValue(this.password);
	},
	/**
	 * @private
	 */
	save: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.doUpdateAuth({
			serviceId: this.serviceId,
			auth: {
				username: this.$.username.getValue(),
				password: this.$.password.getValue()
			}
		});
	}
});