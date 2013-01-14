enyo.kind({
	name: "PhonegapUserdata",
	kind: "Ares.Groupbox",
	classes: "onyx-groupbox enyo-fill",
	published: {
		userData: {}
	},
	components: [
		{kind: "onyx.GroupboxHeader", content: "PhoneGap Account"},
		{components: [
			{content: "User ID:", kind: "Ares.GroupBoxItemKey"},
			{name: "userId", kind: "Ares.GroupBoxItemValue"}
		], ontap: "manageAccount"},
		{components: [
			{content: "User Login: ", kind: "Ares.GroupBoxItemKey"},
			{name: "username", kind: "Ares.GroupBoxItemValue"}
		], ontap: "manageAccount"},
		{components: [
			{content: "User Email: ", kind: "Ares.GroupBoxItemKey"},
			{name: "email", kind: "Ares.GroupBoxItemValue"}
		], ontap: "manageAccount"},
		{components: [
			{content: "Signing Keys (Android):", kind: "Ares.GroupBoxItemKey"},
			{name: "androidKeys", kind: "Ares.GroupBoxItemValue"}
		], ontap: "manageAccount"},
		{components: [
			{content: "Signing Keys (Blackberry):", kind: "Ares.GroupBoxItemKey"},
			{name: "blackberryKeys", kind: "Ares.GroupBoxItemValue"}
		], ontap: "manageAccount"},
		{components: [
			{content: "Signing Keys (iOS):", kind: "Ares.GroupBoxItemKey"},
			{name: "iosKeys", kind: "Ares.GroupBoxItemValue"}
		], ontap: "manageAccount"},
		{components: [
			{content: "Registered Applications:", kind: "Ares.GroupBoxItemKey"},
			{name: "apps", kind: "Ares.GroupBoxItemValue"}
		], ontap: "manageApps"}
	],
	create: function() {
		this.inherited(arguments);
	},
	setUserData: function(userData) {
		this.userData = userData;
		var keys = enyo.keys(userData);
		enyo.forEach(keys, function(key) {
			if (this.$[key]) {
				var val = userData[key] && userData[key].toString();
				if (this.$[key].setValue) {
					this.$[key].setValue(val);
				} else {
					this.$[key].setContent(val);
				}
			} else {
				this.log("No such display field: '" + key + "'");
			}
		}, this);
	},
	/**
	 * Open the Account Management Page at build.phonegap.com
	 * @protected
	 */
	manageAccount: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var accountPopup = window.open("https://build.phonegap.com/people/edit",
					       "PhoneGap Build Account Management",
					       "resizeable=1,width=1024, height=600");
	},
	/**
	 * Open the Applications Management Page at build.phonegap.com
	 * @protected
	 */
	manageApps: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var accountPopup = window.open("https://build.phonegap.com/apps",
					       "PhoneGap Build Account Management",
					       "resizeable=1,width=1024, height=600");
	}
});