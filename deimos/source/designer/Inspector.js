enyo.kind({
	name: "Inspector",
	kind: "FittableRows",
	events: {
		onModify: "",
		onAction: ""
	},
	published: {
		filterLevel: null,		// Value will be given by Inspector.FilterXXX "checked" item.
		filterType: null,		// Value will be given by Inspector.FilterXXX "checked" item.
		projectIndexer: null,	// Analyzer output for the current project
		projectData: null		// All the project data shared mainly between phobos and deimos
	},
	components: [
		{kind: "Inspector.FilterType", onValueChanged: "updateFilterType"},
		{kind: "Scroller", fit: true, components: [
			{name: "content", kind: "FittableRows", onActivate: "inheritAttributeToggle"}
		]},
		{kind: "Inspector.FilterLevel", onValueChanged: "updateFilterLevel"}
	],
	handlers: {
		onChange: "change",
		onDblClick: "dblclick"
	},
	style: "padding: 8px; white-space: nowrap;",
	debug: false,
	helper: null,			// Analyzer.KindHelper
	userDefinedAttributes: {},
	create: function() {
		this.inherited(arguments);
		this.helper = new Analyzer.KindHelper();
		
		//* TODO - should be moved to KindHelper.js.
		this.helper.getPublishedWithValues = function() {
			this.checkDefAvail();
			var published = [];

			obj = this.definition.properties;
			for (i=0; i<obj.length; i++) {
				if (obj[i].token === "published") {
					p = obj[i].value[0].properties;
					for (var j=0; j < p.length; j++) {
						published.push({
							name:   p[j].name,
							value:  eval(p[j].value[0].token) // <---- TODO - shouldn't have to eval() here. Strings come back with double double quotes ("""")
						});
					}
				}
			}

			return published;
		}
	},
	allowed: function(inKindName, inType, inName) {
		var level = Model.getFilterLevel(inKindName, inType, inName);
		this.debug && this.log("Level: " + level + " for " + inKindName + "." + inName);
		return level >= this.filterLevel;
	},
	//* Return complete list of published properties for _inControl_
	buildPropList: function(inControl) {
		var kindName = inControl.kind;
		var currentKind = kindName;

		var definition = this.getKindDefinition(currentKind);
		if (!definition) {
			this.debug && this.log("NO DEFINITION found for '" + currentKind + "' inControl: ", inControl);
			// Revert to the property and event list extracted from the object
			return this.buildPropListFromObject(inControl);
		}

		// TODO: event list must come from the Analyzer output.
		var domEvents = ["ontap", "onchange", "ondown", "onup", "ondragstart", "ondrag", "ondragfinish", "onenter", "onleave"]; // from dispatcher/guesture
		var propMap = {}, eventMap = {};
		while (definition) {
			// Setup helper with current definition
			this.helper.setDefinition(definition);
			
			// Get all published properties for this kind
			var publishedProperties = this.helper.getPublishedWithValues();
			
			// Add an entry to _propMap[]_ for each property found in _publishedProperties_
			for (var i = 0, p; (p = publishedProperties[i]); i++) {
				if (this.allowed(kindName, "properties", p.name)) {
					this.debug && this.log("Adding property '" + p.name + "' from '" + currentKind + "'");
					propMap[p.name] = p.value;
				}
			}
			
			// Get all events for this kind
			var events = this.helper.getEvents();
			
			// Add an entry to _eventMap[]_ for each event found in _events_
			for (i = 0, p; (p = events[i]); i++) {
				if (this.allowed(kindName, "events", p)) {
					this.debug && this.log("Adding event '" + p + "' from '" + currentKind + "'");
					eventMap[p] = true;
				}
			}
			
			// Set _currentKind_ to the next superkind (if exists)
			currentKind = definition.superkind || "";
			
			if (currentKind === "") {
				definition = null;
			} else {
				definition = this.getKindDefinition(currentKind);
			}
		}
		
		var props = propMap;
		
		props.events = [];
		for (n in eventMap) {
			props.events.push(n);
		}
		for (n=0; n < domEvents.length; n++) {
			if (this.allowed(kindName, "events", domEvents[n])) {
				props.events.push(domEvents[n]);
			}
		}
		
		return props;
	},
	buildPropListFromObject: function(inControl) {
		// Get the property and event list from the Object as we cannot get it from the analyzer
		var domEvents = ["ontap", "onchange", "ondown", "onup", "ondragstart", "ondrag", "ondragfinish", "onenter", "onleave"]; // from dispatcher/guesture
		var propMap = {}, eventMap = {};
		var context = inControl;
		var kindName = inControl.kind;
		while (context) {
			for (var p in context.published) {
				if (this.allowed(kindName, "properties", p)) {
					this.debug && this.log("Adding property '" + p + "' from '" + context.kind + "'");
					propMap[p] = true;
				}
			}
			for (var e in context.events) {
				if (this.allowed(kindName, "events", e)) {
					this.debug && this.log("Adding event '" + e + "' from '" + context.kind + "'");
					eventMap[e] = true;
				}
			}
			context = context.base && context.base.prototype;
		}
		var props = [];
		var propKeys = Object.keys(propMap).sort();
		for (var n = 0; n < propKeys.length; n++) {
			props.push(propKeys[n]);
		}
		props.events = [];
		for (var n in eventMap) {
			props.events.push(n);
		}
		for (n=0; n < domEvents.length; n++) {
			if (this.allowed(kindName, "events", domEvents[n])) {
				props.events.push(domEvents[n]);
			}
		}
		return props;
	},
	makeEditor: function(inControl, inName, inDefaultValue, inType) {
		if(inName === "events") {
			return;
		}
		
		this.debug && this.log("Adding entry for " + inType + " " + inName + " : " + inDefaultValue);
		
		var inherited = !(inControl.aresId && this.userDefinedAttributes && this.userDefinedAttributes[inControl.aresId] && typeof this.userDefinedAttributes[inControl.aresId][inName] !== "undefined"),
			value = (inherited) ? inDefaultValue : this.userDefinedAttributes[inControl.aresId][inName],
			classList = "ares-inspector-row",
			attributeRow,
			info,
			kind,
			attributeKind,
			attributeFieldName = "attributeVal";
		
		attributeRow = this.$.content.createComponent({classes: classList});
		attributeRow.createComponent({kind: "InheritCheckbox", checked: !inherited, prop: inName});
		
		info = Model.getInfo(inControl.kind, inType, inName);
		kind = (info && info.inputKind);
		
		// User defined kind: as an Object
		if (kind && kind instanceof Object) {
			kind = enyo.clone(kind);
			kind = enyo.mixin(kind, {name: attributeFieldName, fieldName: inName, fieldValue: value, extra: inType});
			attributeRow.createComponent(kind);
		} else {
			attributeKind = (kind)
				?	kind
				:	(value === true || value === false || value === "true" || value === "false")
					?	"Inspector.Config.Boolean"
					:	"Inspector.Config.Text";
		
			attributeRow.createComponent({name: attributeFieldName, kind: attributeKind, fieldName: inName, fieldValue: value, extra: inType, disabled: inherited});
		}
	},
	inspect: function(inControl) {
		var ps, i, p;
		this.$.content.destroyComponents();
		this.selected = inControl;
		if (inControl) {
			var kindName = inControl.kind;
			this.$.content.createComponent({tag: "h3", content: kindName, classes: "label label-info"});
			ps = this.buildPropList(inControl);
			if (this.filterType === 'P') {
				this.$.content.createComponent({classes: "onyx-groupbox-header", content: "Properties"});
				for (p in ps) {
					this.makeEditor(inControl, p, ps[p], "properties");
				}
			} else {
				ps = ps.events;
				if (ps.length) {
					this.$.content.createComponent({classes: "onyx-groupbox-header", content: "Events"});
				}
				for (i=0, p; (p=ps[i]); i++) {
					this.makeEditor(inControl, p, "events");
				}
			}
		}
		this.$.content.render();
	},
	change: function(inSender, inEvent) {
		var n = inEvent.target.fieldName;
		var v = inEvent.target.fieldValue;
		
		var num = parseFloat(v);
		if (String(num) == v) {
			v = num;
		}

		this.debug && this.log(n, v);
		
		// Save each change to _this.userDefinedAttributes_
		if(!this.userDefinedAttributes[this.selected.aresId]) {
			this.userDefinedAttributes[this.selected.aresId] = {};
		}
		this.userDefinedAttributes[this.selected.aresId][n] = v;
		
		this.doModify({name: n, value: v});
	},
	dblclick: function(inSender, inEvent) {
		if (inEvent.target.extra === "events") {
			//this.changeHandler(inSender, inEvent);
			var n = inEvent.target.fieldName;
			var v = inEvent.target.fieldValue;
			// FIXME: hack to supply a default event name
			if (!v) {
				v = inEvent.target.fieldName = this.selected.name + enyo.cap(n.slice(2));
				this.debug && this.log("SET handler: " + n + " --> " + v);
				this.selected.setProperty(n, v);
				this.change(inSender, inEvent);
				inEvent.target.setFieldValue(v);
			}
			this.doAction({value: v});
		}
	},
	/**
	 * Receive the project data reference which allows to access the analyzer
	 * output for the project's files, enyo/onyx and all the other project
	 * related information shared between phobos and deimos.
	 * @param  oldProjectData
	 * @protected
	 */
	projectDataChanged: function(oldProjectData) {
		if (this.projectData) {
			this.projectData.on('change:project-indexer', this.projectIndexReady, this);
			this.projectData.on('update:project-indexer', this.projectIndexUpdated, this);
			this.setProjectIndexer(this.projectData.getProjectIndexer());
		}
		if (oldProjectData) {
			oldProjectData.off('change:project-indexer', this.projectIndexReady);
			oldProjectData.off('update:project-indexer', this.projectIndexUpdated);
		}
	},
	/**
	 * The project analyzer output has changed
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexReady: function(model, value, options) {
		this.setProjectIndexer(value);
	},
	projectIndexUpdated: function() {
		Model.buildInformation(this.projectIndexer);
	},
	initUserDefinedAttributes: function(inComponents) {
		this.userDefinedAttributes = {};
		
		var components = this.flattenComponents(inComponents);
		
		for(var i = 0, component; (component = components[i]); i++) {
			this.userDefinedAttributes[component.aresId] = component;
		}
	},
	flattenComponents: function(inComponents) {
		var ret = [],
			cs,
			c;
		
		if(!inComponents) {
			return ret;
		}
		
		for (var i = 0; (c = inComponents[i]); i++) {
			ret.push(c);
			if(c.components) {
				cs = this.flattenComponents(c.components);
				for (var j = 0; (c = cs[j]); j++) {
					ret.push(c);
				}
			}
		}
		
		return ret;
	},
	/**
	 * Locates the requested kind name based the following priorties
	 * - in the analysis of the currently edited file (most accurate)
	 * - else in the analysis of the project
	 * - else in the analysis of enyo/ares
	 * @param name: the kind to search
	 * @returns the definition of the requested kind or undefined
	 */
	getKindDefinition: function(name) {
		var definition = this.projectIndexer.findByName(name);
		if (definition === undefined) {
			// Try again with the enyo prefix as it is optional
			definition = this.projectIndexer.findByName("enyo." + name);
		}
		return definition;
	},
	/**
	 * The inspector's filters have changed.
	 * @protected
	 */
	updateFilterLevel: function(inSender, inEvent) {
		if (inEvent.active) {
			this.setFilterLevel(inEvent.active.value);
			this.inspect(this.selected);
		}
		return true;
	},
	updateFilterType: function(inSender, inEvent) {
		if (inEvent.active) {
			this.setFilterType(inEvent.active.value);
			this.inspect(this.selected);
		}
		return true;
	},
	//* When an inherit checkbox is toggled, enable/disable the attribute
	inheritAttributeToggle: function(inSender, inEvent) {
		var originator = inEvent.originator,
			row = originator.parent,
			attribute = originator.prop;
		
		// Make sure this attribute exists in _this.userDefinedAttributes_
		if(!this.userDefinedAttributes[this.selected.aresId]) {
			this.userDefinedAttributes[this.selected.aresId] = {};
		}
		
		if (originator.active === true) {
			row.$.attributeVal.setDisabled(false);
			
			// Add this attribute to the rendered instance
			this.userDefinedAttributes[this.selected.aresId][attribute] = row.$.attributeVal.getFieldValue();
		} else {
			row.$.attributeVal.setFieldValue(this.buildPropList(this.selected)[attribute]);
			row.$.attributeVal.setDisabled(true);
			delete this.userDefinedAttributes[this.selected.aresId][attribute];
			
			// Remove this attribute from the rendered instance in the iframe by setting it to _undefined_
			this.doModify({name: attribute, value: undefined});
		}
	}
});

enyo.kind({
	name: "Inspector.FilterLevel",
	events: {
		onValueChanged: ""
	},
	components: [
		{kind: "onyx.RadioGroup", fit:false, onActivate:"doValueChanged", style:"display:block;", controlClasses: "onyx-tabbutton inspector-tabbutton thirds", components: [
			{value: Model.F_USEFUL, content: "Frequent"},
			{value: Model.F_NORMAL, content: "Normal", active: true},
			{value: Model.F_DANGEROUS, content: "All"}
		]}
	]
});

enyo.kind({
	name: "Inspector.FilterType",
	events: {
		onValueChanged: ""
	},
	components: [
		{kind: "onyx.RadioGroup", fit:false, onActivate:"doValueChanged", style:"display:block;", controlClasses: "onyx-tabbutton inspector-tabbutton halves", components: [
			{content:"Properties", value: "P", active:true},
			{content:"Events", value: "E"}
		]}
	]
});

enyo.kind({
	name: "InheritCheckbox",
	kind: "enyo.Checkbox",
	published: {
		prop: null
	},
	handlers: {
		onActivate: "handleActivate"
	},
	allowActivate: false,
	rendered: function() {
		this.inherited(arguments);
		this.allowActivate = true;
	},
	//* Stop extraneous activate event from being fired when box is initially checked
	handleActivate: function(inSender, inEvent) {
		if(!this.allowActivate) {
			return true;
		}
	}
});

