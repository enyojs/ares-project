/* global ilibHarmonia */
enyo.kind({
	name: "NamePopup",
	kind: "onyx.Popup",
	published: {
		title: ilibHarmonia("New"),
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
	classes:"ares-classic-popup",
	modal: true,
	centered: true,
	floating: true,
	components: [
		{tag: "div", name: "title", classes: "title", content: ilibHarmonia("Name for new object")},
		{kind: "enyo.Scroller", classes:"ares-small-popup", fit: true, components: [
			{tag: "p", classes: "break"},
			{kind: "onyx.InputDecorator", components: [
				{name: "fileName", kind: "onyx.Input", onkeyup: "nameChanged", placeholder: ""}
			]},
			{classes:"ares-small-popup-details", components:[
				{name: "path", tag: "p", content: ilibHarmonia("Path:")}
			]}
		]},
		{kind: "onyx.Toolbar", classes: "bottom-toolbar", components: [
			{name:"cancelButton", kind: "onyx.Button", content: ilibHarmonia("Cancel"), ontap: "newCancel"},
			{name:"confirmButton", classes: "right", kind: "onyx.Button", content: ilibHarmonia("Create"), ontap: "newConfirm"}
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
		var typeForTitle = "";
		if(this.type !== undefined){
			typeForTitle = this.type;
		}
		this.$.title.setContent(this.title+" "+typeForTitle);
	},
	titleChanged: function() {
		var typeForTitle = "";
		if(this.type !== undefined){
			typeForTitle = this.type;
		}
		this.$.title.setContent(this.title+" "+typeForTitle);
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
		this.$.confirmButton.setDisabled(this.fileName.length === 0);
	},
	placeHolderChanged: function(inSender, inEvent) {
		this.$.fileName.setPlaceholder(this.placeHolder);
	},
	shown: function(inSender, inEvent) {
		this.$.fileName.focus();
	}
});	