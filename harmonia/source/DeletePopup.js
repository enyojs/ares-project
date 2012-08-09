enyo.kind({
	name: "DeletePopup",
	kind: "onyx.Popup",
	published: {
		type: "file",
		fileName: "",
		path: "",
	},
	events: {
		onConfirm: "",
		onCancel: ""
	},
	modal: true,
	centered: true,
	floating: true,
	components: [
		{name: "title", tag: "h3", content: "Delete file?"},
		{name: "path", tag: "p", content: "Path: "},
		{tag: "br"},
		{tag: "br"},
		{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "deleteCancel"},
		{kind: "onyx.Button", classes: "onyx-affirmative", content: "Delete", ontap: "deleteConfirm"},
	],
	create: function() {
		this.inherited(arguments);
		this.typeChanged();
		this.pathChanged();
	},
	typeChanged: function() {
		this.$.title.setContent("Delete "+this.type+" "+this.fileName+"?");
	},
	fileNameChanged: function() {
		this.$.title.setContent("Delete "+this.type+" "+this.fileName+"?");
	},
	pathChanged: function() {
		this.$.path.setContent("in "+this.path);
	},
	deleteCancel: function(inSender, inEvent) {
		this.hide();
		this.doCancel();
	},
	deleteConfirm: function(inSender, inEvent) {
		this.hide();
		this.doConfirm({name: this.fileName});
	}
});
