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
		enyoIndexer: null,		// Analyzer output for enyo/onyx used by the current project
		projectIndexer: null,	// Analyzer output for the current project
		fileIndexer: null,		// Analyzer output for the current file
		projectData: null		// All the project data shared mainly between phobos and deimos
	},
	components: [
		{kind: "Inspector.FilterType", onValueChanged: "updateFilterType"},
		{kind: "Scroller", fit: true, components: [
			{name: "content", kind: "FittableRows"}
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
	create: function() {
		this.inherited(arguments);
		this.helper = new Analyzer.KindHelper();
	},
	allowed: function(inKindName, inType, inName) {
		var level = Model.getFilterLevel(inKindName, inType, inName);
		// this.debug && this.log("Level: " + level + " for " + inKindName + "." + inName);
		return level >= this.filterLevel;
	},
	buildPropList: function(inControl) {

		var kindName = inControl.kind;
		var currentKind = kindName;

		var definition = this.getKindDefinition(currentKind);
		if ( ! definition) {
			this.debug && this.log("NO DEFINITION found for '" + currentKind + "' inControl: ", inControl);
			// Revert to the property and event list extracted from the object
			return this.buildPropListFromObject(inControl);
		}

		// TODO: event list must come from the Analyzer output.
		var domEvents = ["ontap", "onchange", "ondown", "onup", "ondragstart", "ondrag", "ondragfinish", "onenter", "onleave"]; // from dispatcher/guesture
		var propMap = {}, eventMap = {};
		while (definition) {
			this.helper.setDefinition(definition);
			var names = this.helper.getPublished();
			for (var i = 0, p; (p = names[i]); i++) {
				if (this.allowed(kindName, "properties", p)) {
					this.debug && this.log("Adding property '" + p + "' from '" + currentKind + "'");
					propMap[p] = true;
				}
			}
			names = this.helper.getEvents();
			for (i = 0, p; (p = names[i]); i++) {
				if (this.allowed(kindName, "events", p)) {
					this.debug && this.log("Adding event '" + p + "' from '" + currentKind + "'");
					eventMap[p] = true;
				}
			}
			currentKind = definition.superkind || "";
			if (currentKind === "") {
				definition = null;
			} else {
				definition = this.getKindDefinition(currentKind);
			}
		}
		var props = [];
		var propKeys = Object.keys(propMap).sort();
		for (var n = 0; n < propKeys.length; n++) {
			props.push(propKeys[n]);
		}
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
					// this.debug && this.log("Adding property '" + p + "' from '" + context.kind + "'");
					propMap[p] = true;
				}
			}
			for (var e in context.events) {
				if (this.allowed(kindName, "events", e)) {
					// this.debug && this.log("Adding event '" + e + "' from '" + context.kind + "'");
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
	makeEditor: function(inControl, inName, inType) {
		this.debug && this.log("Adding entry for " + inType + " " + inName);
		var info = Model.getInfo(inControl.kind, inType, inName);
		var kind = (info && info.inputKind);
		var v = inControl[inName];
		if (v === undefined) {
			v = enyo.constructorForKind(inControl.kind).prototype[inName];	// <--- TODO - this is using the Ares code rather than the project
			/* Need to do analyzer check here to find prototype for this kind */
			if(v === undefined) {
				v = "";
			}
		}

		// Select the good input kind
		if (kind && kind instanceof Object) {	// User defined kind: as an Object
			kind = enyo.clone(kind);
			kind = enyo.mixin(kind, {fieldName: inName, fieldValue: v, extra: inType});
			this.$.content.createComponent(kind);
		} else if (kind) {						// User defined kind: We assume it's a String
			this.$.content.createComponent({kind: kind, fieldName: inName, fieldValue: v, extra: inType});
		} else if (v === true || v === false) {
			this.$.content.createComponent({kind: "Inspector.Config.Boolean", fieldName: inName, fieldValue: v, extra: inType});
		} else {
			this.$.content.createComponent({kind: "Inspector.Config.Text", fieldName: inName, fieldValue: v, extra: inType});
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
				for (i=0, p; (p=ps[i]); i++) {
					this.makeEditor(inControl, p, "properties");
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
		//this.selected.setProperty(n, v);
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
			this.projectData.on('change:enyo-indexer', this.enyoIndexReady, this);
			this.projectData.on('change:project-indexer', this.projectIndexReady, this);

			this.setEnyoIndexer(this.projectData.getEnyoIndexer());
			this.setProjectIndexer(this.projectData.getProjectIndexer());
		}
		if (oldProjectData) {
			oldProjectData.off('change:enyo-indexer', this.enyoIndexReady);
			oldProjectData.off('change:project-indexer', this.projectIndexReady);
		}
	},
	/**
	 * The enyo/onyx analyzer output has changed for the current project
	 * @param value   the new analyzer output
	 * @protected
	 */
	enyoIndexReady: function(model, value, options) {
		this.setEnyoIndexer(value);
	},
	/**
	 * The project analyzer output has changed
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexReady: function(model, value, options) {
		this.setProjectIndexer(value);
	},
	/**
	 * The current file  analyzer output has changed
	 * @param value   the new analyzer output
	 * @protected
	 */
	fileIndexerChanged: function() {
		this.localKinds = {};	// Reset the list of kinds for the currently edited file
		if (this.fileIndexer && this.fileIndexer.objects) {
			for(var i = 0, o; (o = this.fileIndexer.objects[i]); i++) {
				this.localKinds[o.name] = o;
			}
		}
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
		var definition = this.localKinds[name];
		
		if (definition === undefined && this.projectIndexer) {
			// Try to get it from the project analysis
			definition = this.projectIndexer.findByName(name);
		}

		if (definition === undefined && this.enyoIndexer) {
			// Try to get it from the enyo/onyx analysis
			definition = this.enyoIndexer.findByName(name);

			if (definition === undefined) {
				// Try again with the enyo prefix as it is optional
				definition = this.enyoIndexer.findByName("enyo." + name);
			}
		}
		
		return definition;
	},
	/**
	 * The inspector's filters have changed.
	 * @protected
	 */
	updateFilterLevel: function(inSender, inEvent) {
		this.setFilterLevel(inEvent.active.value);
		this.inspect(this.selected);
		return true; // Stop the propagation of the event
	},
	updateFilterType: function(inSender, inEvent) {
		this.setFilterType(inEvent.active.value);
		this.inspect(this.selected);
		return true; // Stop the propagation of the event
	}
});

enyo.kind({
	name: "Inspector.FilterLevel",
	events: {
		onValueChanged: ""
	},
	components: [
		{kind: "onyx.RadioGroup", fit:false, onActivate:"doValueChanged", style:"display:block;", controlClasses: "onyx-tabbutton inspector-tabbutton thirds", components: [
			{value: Model.F_USEFUL, content: "Frequent", active: true},
			{value: Model.F_NORMAL, content: "Normal"},
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

