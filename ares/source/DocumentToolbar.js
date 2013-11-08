enyo.kind({
	name: "DocumentToolbar",
	kind:"FittableRows",
	events: {
		onToggleOpen: "",
		onSwitchFile: "",
		onCloseFileRequest: "",
		onRegisterMe: "",
		onGrabberClick: "",
		onAceFocus: ""
	},
	components: [	
		{
			name: "tabs",
			kind: "onyx.TabBar",
			classes: "ares-small-toolbar title-gradient",
			showing: false,
			checkBeforeClosing: true,
			onTabChanged: 'switchFile',
			onTabRemoveRequested: 'requestCloseFile',
			onHide: "doAceFocus"
		}
	],

	create: function() {
		this.inherited(arguments);
		this.doRegisterMe({name:"documentToolbar", reference:this});
	},
	createFileTab: function(name, id, path) {
		this.$.tabs.show();
		this.$.tabs.render();
		this.$.tabs.addTab({
			caption: name,
			// id like home-123f3c8a766751826...
			// id encodes project name and file path
			userId: id,
			tooltipMsg: path
		});
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
