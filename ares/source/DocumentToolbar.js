enyo.kind({
	name: "DocumentToolbar",
	kind: "onyx.Toolbar",

	events: {
		onToggleOpen: "",
		onSwitchFile: "",
		onCloseFileRequest: "",
		onDesign: "",
		onRegisterMe: ""
	},

	components: [
		{kind: "onyx.Grabber", ontap: "doToggleOpen", classes: "ares-grabber"},
		{
			name: "tabs",
			kind: "onyx.TabBar",
			showing: false,
			checkBeforeClosing: true,
			onTabChanged: 'switchFile',
			onTabRemoveRequested: 'requestCloseFile'
		}
	],

	create: function() {
		this.inherited(arguments);
		var self = this;
		this.doRegisterMe({name:"documentToolbar", reference:self});
	},
	createFileTab: function(name, id) {
		this.$.tabs.show();
		this.$.tabs.render();
		this.$.tabs.addTab(
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

	requestCloseFile: function(inSender, inEvent) {
		// inEvent.next callback is ditched. Ares will call removeTab
		// when file is closed by Ace
		this.doCloseFileRequest({id: inEvent.userId});
		return true;
	},
	removeTab: function(id) {
		this.$.tabs.removeTab({ userId: id }) ;
		if (this.$.tabs.isEmpty() ) {
			this.$.tabs.hide();
		}
	}
});
