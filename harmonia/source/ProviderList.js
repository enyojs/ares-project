enyo.kind({
	name: "ProviderList",
	kind: "FittableRows",
	debug: false,

	properties: [ 'type' ],
	published: {
		type: "",
		propertiesJSON: '["type"]',
		header: "",
		// use 0 to pre-select the first storage provider of
		// the list... or get an expection at first load.
		selected: -1
	},
	events: {
		onSelectProvider: ""
	},
	classes: "onyx-dark ares_harmonia_providerList",
	components: [
		{name: "header", kind: "onyx.Toolbar", content: "", classes: "onyx-menu-toolbar ares_harmonia_toolBar"},
		{name: "list", kind: "FlyweightRepeater", classes: "ares_harmonia_providerItems", fit: true, toggleSelected: false, onSetupItem: "setupRow", onSelect: "rowSelected", onDeselect: "rowDeselected", components: [
			{name: "item", classes: "enyo-children-inline", ontap: "itemTap", ondblclick: "dblClick", /*onConfirm: "removeProvider",*/ components: [
				{name: "icon", kind: "onyx.Icon"},
				{name: "name"},
				{name: "auth", kind: "Image", src: "$harmonia/images/valid-check.png", showing: false}
			]}
		]},
		{kind: "Signals", onServicesChange: "handleServicesChange"}
	],
	create: function() {
		this.inherited(arguments);
		this.services = [];
		if (this.debug) this.log("type:", this.type, ", propertiesJSON=", this.propertiesJSON);
		try {
			this.properties = JSON.parse(this.propertiesJSON);
			if (typeof this.properties[0] !== 'string') {
				throw new Error('BUG: wrong propertiesJSON=' + this.propertiesJSON);
			}
		} catch (err) {
			this.properties = undefined;
		}
		if (this.debug) this.log("type:", this.type, ", properties=", this.properties);

		if (!this.header) {
			this.$.header.hide();
		} else {
			this.$.header.setContent(this.header);
		}
	},
	/**
	 * Receive the {onServicesChange} broadcast notification
	 * @param {Object} inEvent.serviceRegistry
	 */
	handleServicesChange: function(inSender, inEvent) {
		//if (this.debug) this.log("sender:", inSender, "event:", inEvent);
		// filter-out on service type (if defined)
		this.services = inEvent.serviceRegistry.filter({
			properties: this.properties,
			type: this.type
		});
		if (this.debug) this.log("type=" + this.type + ", properties=" + this.properties, "=> services:", this.services);
		this.$.list.count = this.services.length;
		this.$.list.render();
		// re-select the line that was selected before service changed
		this.doSelectProvider({service: this.services[this.selected]});
	},
	setupRow: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		var p = this.services[inEvent.index], config;
		if (p) {
			config = p.getConfig();
			this.$.item.applyStyle("background-color", inSender.isSelected(inEvent.index) ? "lightblue" : "");
			this.$.name.setContent(config.name);
			this.$.icon.setSrc("$harmonia/images/providers/" + config.icon + ".png");
		}
		return true;
	},
	selectedChanged: function(inOld) {
		this.$.list.getSelection().select(this.selected);
	},
	rowSelected: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.selected = inEvent.key;
		var p = this.services[this.selected];
		if (p) {
			this.doSelectProvider({service: p});
		}
	}
});
