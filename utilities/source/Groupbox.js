enyo.kind({
	name: "Ares.Groupbox",
	kind: "onyx.Groupbox",
	classes: "enyo-fill onyx-groupbox",

	published: {
		header: ""
	},

	create: function() {
		this.inherited(arguments);
	}
});

enyo.kind({
	name: "Ares.GroupBoxItemKey",
	classes: "ares-groupbox-item-key onyx-groupbox enyo-fill",
	tag: "span",

	create: function() {
		this.inherited(arguments);
	}
});

enyo.kind({
	name: "Ares.GroupBoxItemValue",
	classes: "ares-groupbox-item-value onyx-groupbox enyo-fill",
	tag: "span",

	create: function() {
		this.inherited(arguments);
	}
});

