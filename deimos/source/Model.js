enyo.kind({
	name: "Model",
	kind: "enyo.Component",
	debug: false,
	statics: {
		palette: [],		// TODO: Should replace Palette.model
		filters: {},
		defaultFilters: {},

		F_HIDDEN: -1,
		F_DANGEROUS: 1,
		F_NORMAL: 2,
		F_USEFUL: 3
	},
	create: function() {
		this.palette = Palette.model;		// TODO: TBR when Palette.model is removed
		this.defaultFilters = Model.defaultFilters;
		this.filters = Model.filters;
		//
		this.inherited(arguments);
		//
		this.buildFilters();
	},
	buildFilters: function() {
		this.addFilters("properties", "__default", this.defaultFilters.properties);
		this.addFilters("events", "__default", this.defaultFilters.events);

		enyo.forEach(this.palette, function(category) {
			enyo.forEach(category.items, function(item) {
				if (item.filters) {
					this.addFilters("properties", item.name, item.filters.properties);
					this.addFilters("events", item.name, item.filters.events);
				}
			}, this);
		}, this);
	},
	addFilters: function(inType, inName, inFilters) {
		if (inFilters) {
			this.debug && this.log("Adding " + inType + " filters for " + inName);
			var self = this;

			var mergeFilters = function(inArray, inValue, inDestination) {
				if (inArray) {
					enyo.forEach(Object.keys(inArray), function(name) {
						inDestination[name] = inValue;
						self.debug && self.log("Adding " + name + " = " + inValue);
					});
				}
			};

			if ( ! this.filters[inName]) {
				this.filters[inName] = {};
			}
			if ( ! this.filters[inName][inType]) {
				this.filters[inName][inType] = {};
			}
			var destination = this.filters[inName][inType];

			mergeFilters(inFilters.alwaysHidden, Model.F_HIDDEN, destination);
			mergeFilters(inFilters.dangerous, Model.F_DANGEROUS, destination);
			mergeFilters(inFilters.useful, Model.F_USEFUL, destination);
		}
	}
});
