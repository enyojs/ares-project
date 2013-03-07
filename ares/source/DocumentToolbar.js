enyo.kind({
	name: "AresTab",
	kind: "GroupItem",
	classes: "onyx-radiobutton ares-tab",
});

enyo.kind({
	name: "DocumentToolbar",
	kind: "onyx.Toolbar",
	events: {
		onToggleOpen: "",
		onSwitchFile: "",
		onClose: "",
		onSave: "",
		onNewKind: "",
		onDesign: ""
	},
	components: [
		{name: "container", classes: "ares-docbar-container", kind: "FittableColumns", ontap: "doToggleOpen", components: [
			{kind: "onyx.Grabber", style:"-webkit-transform:rotate(90deg); padding-right:15px;"},
			{kind: "onyx.Drawer", classes: "ares-filedrawer", orient: "h", open: false, showing:false, components: [
				{kind: "FittableColumns", components: [
					{kind: "onyx.Button", content: "Save", ontap: "saveFile"},
					{kind: "onyx.Button", content: "New Kind", ontap: "newKind"},
					{name: "designButton", kind: "onyx.Button", content: "Designer", ontap: "designFile"}
				]}
			]},
			{name: "tabs", classes: "ares-docbar-tabs", kind: "onyx.RadioGroup"}
		]}
	],
	tabs: {},
	showControls: function() {
		this.$.drawer.setOpen(true);
		// lock designButton's width, so it doesn't move when the caption changes
		var w = this.$.designButton.getBounds().width;
		this.$.designButton.setBounds({width: w});
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
				{name: "closeFileButton", kind: "onyx.IconButton", classes: "ares-doc-close", src: "$lib/onyx/images/progress-button-cancel.png", fileId: id, ontap: "closeFile"},
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
		this.$.container.reflow();
	},
	setDesignMode: function(toDesign) {
		if (toDesign) {
			this.$.designButton.setContent("Editor");
		} else {
			this.$.designButton.setContent("Designer");
		}
	}
});
