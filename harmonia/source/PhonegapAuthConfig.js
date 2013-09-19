/* global ares */
enyo.kind({
	name: "PhonegapAuthConfig",
	debug: false,
	kind: "BasicAuthConfig",
	/**
	 * @protected
	 */
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
	},
	/**
	 * Display relevant data following account checking
	 * @protected
	 */
	display: function(data, next) {
		this.trace(data);
		var userData = {
			userId: data.user.id,
			username: data.user.username,
			email: data.user.email,
			apps: data.user.apps.all.length,
			androidKeys: data.user.keys.android.all.length,
			blackberryKeys: data.user.keys.blackberry.all.length,
			iosKeys: data.user.keys.ios.all.length
		};
		if (!this.$.userData.$.pgUserData) {
			this.$.userData.createComponent({kind: "PhonegapUserdata", name: "pgUserData"});
			this.$.userData.$.pgUserData.render();
		}
		this.$.userData.$.pgUserData.setUserData(userData);
		this.$.userData.show();
		enyo.Signals.send("plugin.phonegap.userDataRefreshed");
		next();
	}
});