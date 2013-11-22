/*global enyo, Ares, ComponentsRegistry, ares */

enyo.kind({
	name: "DocumentToolbar",
	kind:"FittableRows",
	events: {
		onToggleOpen: "",
		onSwitchDoc: "",
		onCloseDocRequest: "",
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
			onTabChanged: 'switchDoc',
			onTabRemoveRequested: 'requestCloseDoc',
			onHide: "doAceFocus"
		}
	],

	create: function() {
		this.inherited(arguments);
		ares.setupTraceLogger(this);
		this.doRegisterMe({name:"documentToolbar", reference:this});
	},
	createDocTab: function(name, id, path) {
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

	switchDoc: function(inSender, inEvent) {
		var newDoc = Ares.Workspace.files.get(inEvent.userId);
		this.trace(inEvent.id, newDoc);
		ComponentsRegistry.getComponent("enyoEditor").switchToDocument(newDoc);
		return true;
	},

	activateDocWithId: function(id) {
		this.$.tabs.activate({ userId: id });
	},

	requestCloseDoc: function(inSender, inEvent) {
		// inEvent.next callback is ditched. Ares will call removeTab
		// when file is closed by Ace
		this.doCloseDocRequest({id: inEvent.userId});
		return true;
	},
	removeTab: function(id) {
		this.$.tabs.removeTab({ userId: id }) ;
		if (this.$.tabs.isEmpty() ) {
			this.$.tabs.hide();
		}
	}
});
