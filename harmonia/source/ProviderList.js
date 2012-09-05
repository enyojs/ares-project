enyo.kind({
	name: "ProviderList",
	kind: "FittableRows",
	published: {
		// use 0 to pre-select the first storage provider of
		// the list... or get an expection at first load.
		selected: -1
	},
	events: {
		onSelectProvider: ""
	},
	components: [
		{kind: "onyx.Toolbar", components: [
			{content: "Storage Services"}
			//{kind: "onyx.Button", content: "Reset", Xsrc: "$harmonia/images/server_into.png", hint: "Reset", ontap: "_handleReset"}
		]},
		{fit: true, name: "list", kind: "FlyweightRepeater", toggleSelected: false, onSetupItem: "setupRow", onSelect: "rowSelected", onDeselect: "rowDeselected", components: [
			{name: "item", classes: "enyo-children-inline", style: "padding: 8px 4px 4px; border-bottom: 1px solid gray;", ontap: "itemTap", ondblclick: "dblClick", /*onConfirm: "removeProvider",*/ components: [
				{name: "icon", kind: "onyx.Icon", style: "margin-right: 10px"},
				{name: "name", Xstyle: "width: 80%; display: inline-block;"},
				{name: "auth", kind: "Image", src: "$harmonia/images/valid-check.png", style: "margin-left: 12px; vertical-align: middle;", showing: false}
			]}
		]},
		//{kind: "ProviderConfigPopup", onSave: "saveProvider"},
		{kind: "ServiceRegistry", onServicesChange: "_handleServicesChange"}
	],
	create: function() {
		this.inherited(arguments);
		this.listServices();
	},
	listServices: function() {
		this.$.serviceRegistry.listServices();
	},
	//* @private
	_handleReset: function() {
		this.$.serviceRegistry.reloadServices();
		this.$.list.getSelection().clear();
	},
	//* @private
	_handleServicesChange: function(inSender, inServices) {
		//this.log("RX: services='"+JSON.stringify(inServices)+"'");
		this.providers = inServices || [];
		this.$.list.count = this.providers.length;
		this.$.list.render();
		// re-select the line that was selected before service changed
		this.doSelectProvider({service: this.providers[this.selected]});
	},
	setupRow: function(inSender, inEvent) {
		var p = this.providers[inEvent.index];
		if (p) {
			this.$.item.applyStyle("background-color", inSender.isSelected(inEvent.index) ? "lightblue" : "");
			this.$.name.setContent(p.name);
			this.$.icon.setSrc("$harmonia/images/providers/" + p.icon + ".png");
			//this.$.auth.setShowing(p.type !== "dropbox" || p.auth);
		}
		return true;
	},
	selectedChanged: function(inOld) {
		this.$.list.getSelection().select(this.selected);
	},
	rowSelected: function(inSender, inEvent) {
		this.selected = inEvent.key;
		var p = this.providers[this.selected];
		if (p) {
			if (p.type == "dropbox" && !p.auth) {
				this.authorize(p);
			} else  {
				this.doSelectProvider({service: p});
			}
		}
	},
	authorize: function(inProvider) {
		var c = this.createComponent({kind: "ProviderConfigPopup", floating: true, centered: true, modal: true, autoDismiss: false,  ondragstart: "squelchPopupDrag", components: [
			{kind: "DropboxConfig", onAuth: "auth"}
		]});
		c.render();
		c.show();
	},
	auth: function(inSender) {
		this.providers[this.selected].auth = inSender.auth;
		this.$.serviceRegistry.saveServicesToStorage(this.providers);
		this.doSelectProvider({service: this.providers[this.selected]});
	},
	// FIXME: a floating popup propagates events so if you drag the popup, the panels will drag!
	squelchPopupDrag: function() {
		return true;
	}
});
