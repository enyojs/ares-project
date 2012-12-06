enyo.kind({
	name: "AresTab",
	kind: "GroupItem",
	classes: "onyx-radiobutton ares-tab",
});

enyo.kind({
	name: "DocumentToolbar",
	kind: "onyx.Toolbar",
	events: {
		onGrabberTap: "",
		onSwitchFile: "",
		onClose: "",
		onSave: "",
		onNewKind: "",
		onDesign: "",
	},
	components: [
		{name: "container", classes: "ares-docbar-container", kind: "FittableColumns", components: [
			{kind: "onyx.Grabber", ontap: "doGrabberTap"},
			{kind: "onyx.Drawer", classes: "ares-filedrawer", orient: "h", open: false, components: [
				{kind: "FittableColumns", components: [
					{kind: "onyx.Button", content: "Save", ontap: "saveFile"},
					{kind: "onyx.Button", content: "New Kind", ontap: "newKind"},
					{kind: "onyx.Button", content: "Designer", ontap: "designFile"}
				]}
			]},
			{fit: true},
			{name: "tabs", classes: "ares-docbar-tabs", kind: "onyx.RadioGroup"}
		]}
	],
	tabs: {},
	showControls: function() {
		this.$.drawer.setOpen(true);
	},
	hideControls: function() {
		this.$.drawer.setOpen(false);
	},
	createFileTab: function(name, id) {
		var c = this.$.tabs.createComponent({
			kind: "AresTab",
			fileId: id,
			components: [
	    		{content: name, classes: "ares-tab-label"},
				{kind: "onyx.IconButton", classes: "ares-doc-close", src: "$lib/onyx/images/progress-button-cancel.png", fileId: id, ontap: "closeFile"},
			],
			ontap: "switchFile"
		}, {owner: this}).render();
		this.$.container.reflow();
		this.tabs[id] = c;
	},
	switchFile: function(inSender, inEvent) {
		this.doSwitchFile({id: inSender.fileId});
		return true;
	},
	activateFileWithId: function(id) {
		this.tabs[id].setActive(true);
	},
	closeFile: function(inSender, inEvent) {
		var id = inSender.fileId;
		this.doClose({id: id});
		return true;
		//inSender.parent.destroy();
	},
	saveFile: function(inSender, inEvent) {
		var id = this.$.tabs.getActive().fileId;
		this.doSave({id: id});
		return true;
	},
	designFile: function(inSender, inEvent) {
		var id = this.$.tabs.getActive().fileId;
		this.doDesign({id: id});
		return true;
	},
	newKind: function(inSender, inEvent) {
		var id = this.$.tabs.getActive().fileId;
		this.doNewKind({id: id});
		return true;
	},
	removeTab: function(id) {
		this.tabs[id].destroy();
		this.tabs[id] = undefined;
	}
});
