enyo.kind({
	name: "NamePopup",
	kind: "onyx.Popup",
	published: {
		title: "New",
		type: "",
		path: "",
		folderId: "",
		fileName: "",
		placeHolder: ""
	},
	events: {
		onConfirm: "",
		onCancel: ""
	},
	handlers: {
		onShow: "shown"
	},
	modal: true,
	centered: true,
	floating: true,
	components: [
		{name: "title", tag: "h3", content: "Name for new object"},
		{name: "path", tag: "p", content: "Path: "},
		{kind: "onyx.InputDecorator", components: [
			{name: "fileName", kind: "onyx.Input", onkeyup: "nameChanged", placeholder: ""}
		]},
		{tag: "br"},
		{tag: "br"},
		{kind: "FittableColumns", components: [
			{name:"cancelButton", kind: "onyx.Button", content: "Cancel", ontap: "newCancel"},
			{fit: true},
			{name:"confirmButton", kind: "onyx.Button", content: "Create", ontap: "newConfirm"}
		]}
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
		this.doConfirm({name: name, path: this.path, folderId: this.folderId});
	},
	nameChanged: function(inSender, inEvent) {
		this.setFileName(this.$.fileName.getValue());
		if (inEvent.keyCode === 13 && this.fileName.length > 0) {
			this.newConfirm();
		}
	},
	fileNameChanged: function() {
		this.$.fileName.setValue(this.fileName);
		this.$.confirmButton.setDisabled(this.fileName.length == 0)
	},
	placeHolderChanged: function(inSender, inEvent) {
		this.$.fileName.setPlaceholder(this.placeHolder);
	},
	shown: function(inSender, inEvent) {
		this.$.fileName.focus();
	}
});	