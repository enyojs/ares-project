enyo.kind({
	name: "Ares.Groupbox",
	kind: "onyx.Groupbox",

	published: {
		header: ""
	},

	create: function() {
		this.inherited(arguments);
	}
});

enyo.kind({
	name: "Ares.GroupBoxItemKey",
	classes: "ares-groupbox-item-key",

	create: function() {
		this.inherited(arguments);
	}
});

enyo.kind({
	name: "Ares.GroupBoxItemValue",
	classes: "ares-groupbox-item-value",

	create: function() {
		this.inherited(arguments);
	}
});

