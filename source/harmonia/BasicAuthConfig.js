/* global async, ServiceRegistry, ares, ilibHarmonia */
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
		{kind:"enyo.Scroller", fit:true, classes:"ares-large-content", components:[
			{kind: "Ares.Groupbox", classes:"ares-group-box", components: [
				{kind: "onyx.GroupboxHeader", name: "serviceName"},
				{content: ilibHarmonia("User Name:")},
				{kind: "onyx.InputDecorator", components: [
					{name:"username", kind: "onyx.Input", placeholder: ilibHarmonia("login")}
				]},
				{content: "Password:"},
				{kind: "onyx.InputDecorator", components: [
					{name:"password", kind: "onyx.Input", placeholder: ilibHarmonia("password"), type: "password"}
				]}
			]},
			{name: "accountOps", classes:"ares-align-right ares-row", components: [
				{kind: "onyx.Button", name: "checkBtn", content: ilibHarmonia("Check"), ontap: "check"},
			]},
			{name: "userData"}
		]}
	],

	/**
	 * @protected
	 */
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.trace("serviceId:", this.serviceId, ", serviceName:", this.serviceName, ", username:", this.username, ", password:", 'XXX' /*this.password*/);
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
			enyo.bind(this, this.authenticate),
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
	/**
	 * Update service authentication values
	 * @param {Function} next CommonJS callback, invoked after update is completed
	 * @private
	 */
	authenticate: function(next) {
		this.trace("");
		this.service.authenticate({
			username: this.$.username.getValue(),
			password: this.$.password.getValue()
		}, next);
	},
	/**
	 * Display relevant data following account checking
	 * @protected
	 */
	display: function(data, next) {
		this.trace(data);
		next();
	}
});