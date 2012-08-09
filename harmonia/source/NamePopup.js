enyo.kind({
	name: "NamePopup",
	kind: "onyx.Popup",
	published: {
		title: "Name for new",
		type: "",
		path: "",
		defaultName: ""
	},
	events: {
		onConfirm: "",
		onCancel: ""
	},
	modal: true,
	centered: true,
	floating: true,
	components: [
		{name: "title", tag: "h3", content: "Name for new object"},
		{name: "path", tag: "p", content: "Path: "},
		{kind: "onyx.InputDecorator", components: [
			{name: "fileName", kind: "onyx.Input"}
		]},
		{tag: "br"},
		{tag: "br"},
		{name:"cancelButton", kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "newCancel"},
		{name:"confirmButton", kind: "onyx.Button", classes: "onyx-affirmative", content: "Create", ontap: "newConfirm"},
	],
	create: function() {
		this.inherited(arguments);
		this.typeChanged();
		this.pathChanged();
		this.defaultNameChanged();
	},
	typeChanged: function() {
		this.$.title.setContent(this.title+" "+this.type);
	},
	titleChanged: function() {
		this.$.title.setContent(this.title+" "+this.type);
	},
	pathChanged: function() {
		this.$.path.setContent("in "+this.path);
	},
	defaultNameChanged: function() {
		this.$.fileName.setValue(this.defaultName);
	},
	newCancel: function(inSender, inEvent) {
		this.hide();
		this.doCancel();
	},
	newConfirm: function(inSender, inEvent) {
		var name = this.$.fileName.getValue();
		this.hide();
		this.doConfirm({name: name});
	}
});	