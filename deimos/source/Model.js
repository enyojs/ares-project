enyo.singleton({
	name: "Model",
	kind: "enyo.Component",
	debug: false,
	info: {},
	defaults: null,				// populated by base-design.js

	F_HIDDEN: -1,
	F_DANGEROUS: 1,
	F_NORMAL: 2,
	F_USEFUL: 3,

	levelMapping: null,			// Instanciated at create() time
	create: function() {
		this.inherited(arguments);
		//
		this.levelMapping = {
			"hidden": this.F_HIDDEN,
			"dangerous": this.F_DANGEROUS,
			"normal": this.F_NORMAL,
			"useful": this.F_USEFUL
		};
	},
	buildInformation: function() {
		this.palette = Palette.model,		// TODO: Should replace Palette.model
		this.addInformation("properties", "__default", this.defaults.properties);
		this.addInformation("events", "__default", this.defaults.events);

		enyo.forEach(this.palette, function(category) {
			enyo.forEach(category.items, function(item) {
				this.addInformation("properties", item.name, item.properties);
				this.addInformation("events", item.name, item.events);
			}, this);
		}, this);
	},
	addInformation: function(inType, inName, inInfo) {
		if (inInfo) {
			this.debug && this.log("Adding " + inType + " information for " + inName);

			var fn = function(inType, inName, inSubName, inData) {
				if (inData.filterLevel) {
					inData.level = Model.levelMapping[inData.filterLevel];
					if ( ! inData.level) {
						inData.level = Model.F_NORMAL;
						this.log("Invalid filter level for " + inType + " " + inName + "." + inSubName);
					}
				} else {
					inData.level = Model.F_NORMAL;
				}
				this.debug && this.log("Setting level " + inData.level + " for " + inType + " " + inName + "." + inSubName);
			};
			var addFilterLevel = enyo.bind(this, fn, inType, inName);

			if ( ! this.info[inName]) {
				this.info[inName] = {};
			}
			this.info[inName][inType] = inInfo;

			var keys = Object.keys(inInfo);
			for (var n = 0; n < keys.length; n++) {
				addFilterLevel(keys[n], inInfo[keys[n]]);
			}
		}
	},
	getFilterLevel: function(inKind, inType, inName) {
		var level;
		try {
			level = this.info[inKind][inType][inName].level;
			if ( ! level) {
				level = this.info.__default[inType][inName].level || Model.F_NORMAL;
			}
		} catch(error) {
			var ref = this.info.__default[inType];
			level = (ref[inName] && ref[inName].level) || Model.F_NORMAL;
		}
		return level;
	}
});
