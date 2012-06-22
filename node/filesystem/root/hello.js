enyo.kind({
	name: "PanelTest",
	kind: "FittableRows",
	components: [
		{kind: "onyx.Toolbar", content: "Hello, Panels"},
		{kind: "enyo.Panels", components: [
			{kind: "onyx.TextArea"}	
		]}
	],
	create: function() {
		this.inherited(arguments);
	}
});
