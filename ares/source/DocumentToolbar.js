/*global enyo, ares */

enyo.kind({
	name: "DocumentToolbar",
	kind:"FittableRows",
	events: {
		onToggleOpen: "",
		onSwitchDoc: "",
		onCloseDocRequest: "",
		onRegisterMe: "",
		onGrabberClick: ""
	},
	components: [	
		{
			name: "tabs",
			kind: "onyx.TabBar",
			classes: "ares-small-toolbar title-gradient",
			showing: false,
			checkBeforeClosing: true,
			checkBeforeChanging: true
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

	activateDocWithId: function(id) {
		this.$.tabs.activate({ userId: id });
	},

	removeTab: function(id) {
		this.$.tabs.removeTab({ userId: id }) ;
		if (this.$.tabs.isEmpty() ) {
			this.$.tabs.hide();
		}
	}
});
