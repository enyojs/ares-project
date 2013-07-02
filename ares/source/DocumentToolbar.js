enyo.kind({
	name: "DocumentToolbar",
	kind: "onyx.Toolbar",

	// TODO check if still needed
	classes: "ares-docbar-container",

	events: {
		onToggleOpen: "",
		onSwitchFile: "",
		onCloseFileRequest: ""
	},

	components: [
		{kind: "onyx.Grabber", ontap: "doToggleOpen"},
		{
			name: "tabs",
			kind: "onyx.TabBar",
			onTabChanged: 'switchFile',
			onTabRemove: 'closeFile'
		}
	],

	createFileTab: function(name, id) {
		var c = this.$.tabs.addTab(
			{
				caption: name,
				userId: id // id like home-123f3c8a766751826...
			}
		);
	},
	switchFile: function(inSender, inEvent) {
		this.doSwitchFile({id: inEvent.userId});
		return true;
	},
	activateFileWithId: function(id) {
		this.$.tabs.activate({ userId: id });
	},
	closeFile: function(inSender, inEvent) {
		var id = inSender.fileId;
		this.doClose({id: id});
		return true;
	},
	removeTab: function(id) {
		this.$.tabs.removeTab({ userId: id }) ;
	}
});
