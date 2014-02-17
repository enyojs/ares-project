/*global ares, enyo*/

enyo.kind({
	name: "ProviderList",
	kind: "FittableRows",
	debug: false,
	published: {
		selector: [],
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
		{kind: "enyo.Scroller", fit:true, components:[
			{name: "list", kind: "FlyweightRepeater", classes: "ares_harmonia_providerItems", fit: true, toggleSelected: false, onSetupItem: "setupRow", onSelect: "rowSelected", onDeselect: "rowDeselected", components: [
				{name: "item", classes: "enyo-children-inline", ontap: "itemTap", ondblclick: "dblClick", /*onConfirm: "removeProvider",*/ components: [
					{name: "icon", kind: "onyx.Icon"},
					{name: "name"},
					{name: "auth", kind: "Image", src: "$assets/harmonia/images/valid-check.png", showing: false}
				]}
			]}
		]},
		{kind: "Signals", onServicesChange: "handleServicesChange"}
	],
	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		this.services = [];
		this.trace("selector=", this.selector);
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
		this.trace("sender:", inSender, "event:", inEvent);
		// filter-out on this.selector
		if (this.selector.length === 0) {
			this.error("Unexpected selector value: ", this.selector);
			this.services = [];
		} else if (this.selector[0] === 'type') {
			this.services = inEvent.serviceRegistry.getServicesByType(this.selector[1]);
		} else if (this.selector[0] === 'auth') {
			this.services = inEvent.serviceRegistry.filter(function(service) {
				return service.config.auth;
			});
		} else {
			this.error("Unexpected selector value: ", this.selector);
			this.services = [];
		}
		this.trace("selector=", this.selector, " ==> services: ", this.services);

		this.$.list.count = this.services.length;
		this.$.list.render();
		// re-select the line that was selected before service changed
		this.doSelectProvider({service: this.services[this.selected]});
	},
	setupRow: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var p = this.services[inEvent.index], config;
		if (p) {
			config = p.getConfig();
			this.$.item.applyStyle("background-color", inSender.isSelected(inEvent.index) ? "lightblue" : "");
			this.$.name.setContent(config.name);
			this.$.icon.setSrc(config.icon);
		}
		return true;
	},
	selectedChanged: function(inOld) {
		this.$.list.getSelection().select(this.selected);
	},
	rowSelected: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		this.selected = inEvent.key;
		var p = this.services[this.selected];
		if (p) {
			this.doSelectProvider({service: p});
		}
	},
	/** @ public */
	reset: function () {
		this.selector = null;
		this.setSelected(-1);
	}
});
