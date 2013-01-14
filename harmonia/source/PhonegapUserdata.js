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
		]},
		{components: [
			{content: "User Login: ", kind: "Ares.GroupBoxItemKey"},
			{name: "username", kind: "Ares.GroupBoxItemValue"}
		]},
		{components: [
			{content: "User Email: ", kind: "Ares.GroupBoxItemKey"},
			{name: "email", kind: "Ares.GroupBoxItemValue"}
		]},
		{components: [
			{content: "Registered Applications:", kind: "Ares.GroupBoxItemKey"},
			{name: "apps", kind: "Ares.GroupBoxItemValue"}
		]},
		{components: [
			{content: "Signing Keys (Android):", kind: "Ares.GroupBoxItemKey"},
			{name: "androidKeys", kind: "Ares.GroupBoxItemValue"}
		]},
		{components: [
			{content: "Signing Keys (Blackberry):", kind: "Ares.GroupBoxItemKey"},
			{name: "blackberryKeys", kind: "Ares.GroupBoxItemValue"}
		]},
		{components: [
			{content: "Signing Keys (iOS):", kind: "Ares.GroupBoxItemKey"},
			{name: "iosKeys", kind: "Ares.GroupBoxItemValue"}
		]}
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
	}
});