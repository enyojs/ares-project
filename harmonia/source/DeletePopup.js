enyo.kind({
	name: "DeletePopup",
	kind: "onyx.Popup",
	published: {
		type: "",
		name: "",
		nodeId: "",
		path: ""
	},
	events: {
		onConfirm: "",
		onCancel: ""
	},
	modal: true,
	centered: true,
	floating: true,
	components: [
		{name: "title", tag: "h3", content: "Delete?"},
		//{name: "path", tag: "p", content: "Path: "},
		{tag: "br"},
		{tag: "br"},
		{kind: "FittableColumns", components: [
			{name: "deleteCancelButton", kind: "onyx.Button", content: "Cancel", ontap: "deleteCancel"},
			{fit: true},
			{name: "deleteDeleteButton", kind: "onyx.Button", classes: "onyx-negative", content: "Delete", ontap: "deleteConfirm"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.typeChanged();
		this.nameChanged();
		this.nodeIdChanged();
		this.pathChanged();
	},
	typeChanged: function() {
		this.$.title.setContent("Delete "+this.type+": "+this.name+"?");
	},
	nameChanged: function() {
		this.$.title.setContent("Delete "+this.type+": "+this.name+"?");
	},
	nodeIdChanged: function() {
	},
	pathChanged: function() {
		//this.$.path.setContent("in "+this.path);
	},
	deleteCancel: function(inSender, inEvent) {
		this.hide();
		this.doCancel();
	},
	deleteConfirm: function(inSender, inEvent) {
		this.hide();
		this.doConfirm({name: this.name, nodeId: this.nodeId, path: this.path});
	}
});
