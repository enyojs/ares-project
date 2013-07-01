enyo.kind({
	name: "AresTab",
	kind: "GroupItem",
	classes: "onyx-radiobutton ares-tab"
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
		{
			name: "container",
			classes: "ares-docbar-container",
			kind: "FittableColumns",
			ontap: "doToggleOpen",
			components: [
				{kind: "onyx.Grabber"},
				{name: "tabs", classes: "ares-docbar-tabs", kind: "onyx.RadioGroup"}
			]
		}
	],
	tabs: {},
	createFileTab: function(name, id) {
		var c = this.$.tabs.createComponent(
			{
				kind: "AresTab",
				fileId: id,
				components: [
					{content: name, classes: "ares-tab-label"},
					{
						name: "close-"+id,
						kind: "onyx.IconButton",
						classes: "ares-doc-close",
						src: "$lib/onyx/images/progress-button-cancel.png",
						fileId: id,
						ontap: "closeFile"
					}
				],
				ontap: "switchFile"
			},
			{owner: this}
		).render();
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
	removeTab: function(id) {
		if (this.tabs[id]) {
			this.tabs[id].destroy();
			this.tabs[id] = undefined;
			this.$.container.reflow();
		}
	}
});
