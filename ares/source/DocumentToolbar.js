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
				{
					name: "tabs",
					kind: "onyx.TabBar",
					onTabChanged: 'switchFile',
					onTabRemove: 'closeFile'
				}
			]
		}
	],
	tabs: {},
	createFileTab: function(name, id) {
		var c = this.$.tabs.addTab(
			{
				caption: name,
				userId: id // id like home-123f3c8a766751826...
			}
		);
	},
	switchFile: function(inSender, inEvent) {
		this.doSwitchFile({id: inEvent.data.userId});
		return true;
	},
	activateFileWithId: function(id) {
		this.$.tabs.activate({ userId: id });
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
