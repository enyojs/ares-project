enyo.kind({
	name: "NamePopup",
	kind: "onyx.Popup",
	published: {
		title: "New",
		type: "",
		path: "",
		fileName: "",
		placeHolder: ""
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
			{name: "fileName", kind: "onyx.Input", onchange: "nameChanged", placeholder: ""}
		]},
		{tag: "br"},
		{tag: "br"},
		{name:"cancelButton", kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "newCancel"},
		{name:"confirmButton", kind: "onyx.Button", classes: "onyx-affirmative", content: "Create", ontap: "newConfirm"}
	],
	create: function() {
		this.inherited(arguments);
		this.typeChanged();
		this.pathChanged();
		this.fileNameChanged();
		this.placeHolderChanged();
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
	newCancel: function(inSender, inEvent) {
		this.hide();
		this.doCancel();
	},
	newConfirm: function(inSender, inEvent) {
		var name = this.$.fileName.getValue();
		this.hide();
		this.doConfirm({name: name, path: this.path});
	},
	nameChanged: function(inSender, inEvent) {
		this.setFileName(this.$.fileName.getValue());
	},
	fileNameChanged: function() {
		this.$.fileName.setValue(this.fileName);
	},
	placeHolderChanged: function(inSender, inEvent) {
		this.$.fileName.setPlaceholder(this.placeHolder);
	}
});	