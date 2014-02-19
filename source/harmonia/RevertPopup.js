enyo.kind({
	name: "RevertPopup",
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
	classes:"ares-classic-popup",
	modal: true,
	centered: true,
	floating: true,
	components: [
		{tag: "div", name: "title", classes:"title", content: $L("Revert?")},
		{kind: "enyo.Scroller", classes:"ares-small-popup", fit: true, components: [
			{classes:"ares-small-popup-details", components:[
				{tag: "p", name: "path", content: $L("Path: ")}
			]},
			{tag: "p", classes: "break"}
		]},
		{kind: "onyx.Toolbar", classes:"bottom-toolbar", components: [
			{name: "revertCancelButton", kind: "onyx.Button", content: $L("Cancel"), ontap: "revertCancel"},
			{name: "revertDeleteButton", kind: "onyx.Button", classes:"right", content: $L("Revert"), ontap: "revertConfirm"}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.typeChanged();
		this.nameChanged();
		this.pathChanged();
	},
	typeChanged: function() {
		this.$.title.setContent($L("Revert {type}: {name}?").replace("{type}", this.type).replace("{name}", this.name));
	},
	nameChanged: function() {
		this.$.title.setContent($L("Revert {type}: {name}?").replace("{type}", this.type).replace("{name}", this.name));
	},
	pathChanged: function() {
		this.$.path.setContent($L("to {destination}").replace("{destination}", this.path));
	},
	revertCancel: function(inSender, inEvent) {
		this.hide();
		this.doCancel();
	},
	revertConfirm: function(inSender, inEvent) {
		this.hide();
		this.doConfirm();
	}
});
