enyo.kind({
	name: "PhonegapAuthConfig",
	debug: true,
	kind: "BasicAuthConfig",
	/**
	 * @protected
	 */
	create: function() {
		this.inherited(arguments);
		this.$.manageBtn.show();
	},
	/**
	 * Display relevant data following account checking
	 * @protected
	 */
	display: function(data, next) {
		if (this.debug) this.log(data);
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
		next();
	},
	/**
	 * Open the Account Management Page at build.phonegap.com
	 * @protected
	 */
	manage: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var accountPopup = window.open("https://build.phonegap.com/people/edit",
					       "PhoneGap Build Account Management",
					       "resizeable=1,width=1024, height=600");

	}
});