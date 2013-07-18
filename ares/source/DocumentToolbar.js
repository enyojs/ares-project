enyo.kind({
	name: "DocumentToolbar",
	kind:"FittableRows",
	events: {
		onToggleOpen: "",
		onSwitchFile: "",
		onCloseFileRequest: "",
		onDesign: "",
		onRegisterMe: "",
		onGrabberClick: ""
	},
	components: [	
		{kind: "onyx.Toolbar", classes: "ares-top-toolbar", components: [
			{kind: "onyx.Grabber", classes: "ares-grabber", ontap: "doGrabberClick", components:[
				{kind: "aresGrabber", name: "aresGrabberDirection", classes:"lleftArrow"}
			]}
		]},	
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
		this.doRegisterMe({name:"documentToolbar", reference:this});
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
	},
	switchGrabberDirection: function(active){
		this.$.aresGrabberDirection.switchGrabberDirection(active);
	}
});
