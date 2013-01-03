enyo.kind({
	name: "BasicAuthConfig",

	// private members
	debug: false,

	// public members
	published: {
		serviceName: "",
		username: "",
		password: ""
	},

	// emitted events
	events: {
		onUpdateAuth: "",
		onError: ""
	},

	// static UI elements
	components: [
		{kind: "Ares.Groupbox", classes: "onyx-groupbox enyo-fill", components: [
			{kind: "onyx.GroupboxHeader", name: "serviceName"},
			{content: "User Name:"},
			{kind: "onyx.InputDecorator", components: [
				{name:"username", kind: "onyx.Input", placeholder: "login..."}
			]},
			{content: "Password:"},
			{kind: "onyx.InputDecorator", components: [
				{name:"password", kind: "onyx.Input", placeholder: "password...", type: "password"}
			]},
			{name: "accountOps", components: [
				{kind: "onyx.Button", name: "checkBtn", content: "Check", ontap: "check"},
				{kind: "onyx.Button", name: "manageBtn", content: "Manage", ontap: "manage", showing: false}
			]}
		]},
		{tag: "br"},
		{name: "userData"}
	],

	/**
	 * @protected
	 */
	create: function() {
		this.inherited(arguments);
		if (this.debug) this.log("serviceId:", this.serviceId, ", serviceName:", this.serviceName, ", username:", this.username, ", password:", 'XXX' /*this.password*/);
		this.service = ServiceRegistry.instance.resolveServiceId(this.serviceId);
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
	check: function(inSender, inEvent) {
		var self = this;
		this.$.checkBtn.setDisabled(true);
		this.$.userData.hide();
		async.waterfall([
			enyo.bind(this, this.updateAuth),
			enyo.bind(this.service, this.service.authorize),
			enyo.bind(this, this.display)
		], function(err, results) {
			enyo.log("BasicAuthConfig.check(): err:", err, ", results:", results);
			self.$.checkBtn.setDisabled(false);
			if (err) {
				self.doError({
					msg: "Unable to check " + self.serviceName + " Account",
					details: err.toString()
				});
			}
		});
	},
	manage: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
	},
	/**
	 * Update service authentication values
	 * @param {Function} next CommonJS callback, invoked after update is completed
	 * @private
	 */
	updateAuth: function(next) {
		if (this.debug) this.log('In progress...');
		this.doUpdateAuth({
			serviceId: this.serviceId,
			auth: {
				username: this.$.username.getValue(),
				password: this.$.password.getValue()
			},
			next: next
		});
	},
	/**
	 * Display relevant data following account checking
	 * @protected
	 */
	display: function(data, next) {
		this.log(data);
		next();
	}
});