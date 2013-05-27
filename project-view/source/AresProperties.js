/**
 * This kind provide a widget to tune global properties
 */

enyo.kind({
	name: "AresProperties",
	classes: "enyo-unselectable",
	kind:"onyx.Popup",
	fit: true,
	modal: true, centered: true, floating: true, autoDismiss: false,
	events: {
		onModifiedConfig: "",
		onSaveGeneratedXml: "",
		onDone: ""
	},

	components: [
		{kind: "onyx.RadioGroup", onActivate: "switchDrawers", name: "thumbnail"},
		{name: "toolbarId", classes: "ares-bordered-toolbar", kind: "onyx.Toolbar", components: [
			{name: "ok", kind: "onyx.Button", content: "OK", ontap: "confirmTap"}
		]},
		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"},
		{kind: "Signals", onPluginRegist: "handlePluginRegist"}
	],

	debug: false,
	
	/**
	 * @protected
	 */
	create: function() {
		this.inherited(arguments);
	},

	/**
	 * Receive the {onPluginRegist} broadcast notification
	 * @param {Object} inEvent.pluginService
	 */
	handlePluginRegist: function(inSender, inEvent) {
		if (this.debug) this.log();
		
		var pluginService = {
			id: inEvent.pluginService.id,
			name: inEvent.pluginService.getName() || inEvent.pluginService.getId(),
			kind: inEvent.pluginService.getAresPropertiesKind()
		};

		var drawer = this.createComponent({
			name: pluginService.id + 'Drawer',
			kind: "onyx.Drawer",
			open: false
		},{addBefore: this.$.toolbarId});

		pluginService.panel = drawer.createComponent({
			name: pluginService.id,
			kind: pluginService.kind
		});

		pluginService.tab = this.$.thumbnail.createComponent({
			name: pluginService.id + 'Tab',
			content: pluginService.name,
			pluginServiceId: pluginService.id,
			showing: true,
			active: true
		});
	},

	// /**
	//  * close one drawer and open the other depending on which radio button was tapped
	//  */
	switchDrawers: function(inSender, inEvent) {
		if (inEvent.originator.active === true ) {
			enyo.forEach(inEvent.originator.parent.children, function(tab) {
				var activate = (tab.pluginServiceId === inEvent.originator.pluginServiceId);
				this.$[tab.pluginServiceId+ 'Drawer'].setOpen(activate);
			}, this);
		}
	},

	confirmTap: function(inSender, inEvent) {
		this.hide();
	}
	
});
