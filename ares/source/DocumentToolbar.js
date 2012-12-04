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
					{kind: "onyx.Button", content: "Save", ontap: "doSave"},
					{kind: "onyx.Button", content: "New Kind", ontap: "doNewKind"},
					{kind: "onyx.Button", content: "Designer", ontap: "doDesign"}
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
	createFileTab: function(file) {
		var id = file.id;
		var c = this.$.tabs.createComponent({
			classes: "ares-tab-button",
			file: file,
			components: [
	    		{content: file.name},
				{kind: "onyx.IconButton", classes: "ares-doc-close", src: "$lib/onyx/images/progress-button-cancel.png", ontap: "closeFile"},
			],
			ontap: "switchFile"
		}, {owner: this}).render();;
		this.$.container.reflow();
		this.tabs[id] = c;
	},
	switchFile: function(inSender, inEvent) {
		this.doSwitchFile({file: inSender.file});
	},
	closeFile: function(inSender, inEvent) {
		//inSender.parent.destroy();
	},
	activateFileWithId: function(id) {
		this.tabs[id].setActive(true);
	}
});
