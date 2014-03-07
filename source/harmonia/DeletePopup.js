/*global ilibHarmonia */
enyo.kind({
	name: "DeletePopup",
	kind: "onyx.Popup",
	published: {
		type: "",
		name: "",
		path: ""
	},
	events: {
		onConfirm: "",
		onCancel: ""
	},
	modal: true,
	centered: true,
	floating: true,
	classes:"ares-classic-popup",
	components: [
		{tag: "div", name: "title", classes: "title", content: ilibHarmonia("Delete")},
		{kind: "enyo.Scroller", classes:"ares-small-popup", fit: true, components: [
			{tag:"p", classes: "break"},
			{kind: "onyx.InputDecorator", components: [
				{name: "name", kind: "onyx.Input", disabled: true}
			]},
			{classes:"ares-small-popup-details", components:[
				{name: "path", tag: "p", content: ilibHarmonia("Path: ")}
			]}
		]},
		{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
			{name:"deleteCancelButton", kind: "onyx.Button", content: ilibHarmonia("Cancel"), ontap: "deleteCancel"},
			{name:"deleteDeleteButton", classes:"right", kind: "onyx.Button", content: ilibHarmonia("Delete"), ontap: "deleteConfirm"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.typeChanged();
		this.nameChanged();
		this.pathChanged();
	},
	typeChanged: function() {
		this.$.title.setContent("Delete "+this.type);
	},
	nameChanged: function() {
		this.$.name.setValue(this.name);
	},
	pathChanged: function() {
		var fileName = this.$.name.getValue();
		var where = this.path.substring(0, this.path.lastIndexOf(fileName));
		this.$.path.setContent("in "+where);
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
