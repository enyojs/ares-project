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
		{name: "filterLevel", kind: "Inspector.FilterLevel", onValueChanged: "updateFilterLevel"}
	],
	handlers: {
		onChange: "change",
		onDblClick: "dblclick",
		onPositionPropertyChanged: "positionPropertyChanged"
	},
	style: "padding: 8px; white-space: nowrap;",
	debug: false,
	helper: null,			// Analyzer.KindHelper
	userDefinedAttributes: {},
	//* @protected
	create: function() {
		this.inherited(arguments);
		this.helper = new analyzer.Analyzer.KindHelper();
		
		//* TODO - should be moved to KindHelper.js.
		this.helper.getPublishedWithValues = function() {
			this.checkDefAvail();
			var published = [];

			obj = this.definition.properties;
			for (i=0; i<obj.length; i++) {
				if (obj[i].token === "published") {
					p = obj[i].value[0].properties;
					for (var j=0; j < p.length; j++) {
						if (p[j].value[0].type != "array") {
							var val = "";
							try {
								// TODO - shouldn't have to eval() here. Strings come back with double double quotes ("""")
								val = eval(p[j].value[0].token);
							} catch(err) {
								enyo.warn("Invalid value for property '" + p[j].name +"': " +  p[j].value[0].token);
							}
							published.push({
								name:   p[j].name,
								value:  val
							});
						}
					}
				}
			}
			return published;
		}
	},
	//* @protected
	allowed: function(inKindName, inType, inName) {
		var level = Model.getFilterLevel(inKindName, inType, inName);
		if (this.debug) { this.log("Level: " + level + " for " + inKindName + "." + inName); }		
		return level >= this.filterLevel;
	},
	//* Return complete list of published properties for _inControl_
	//* @protected
	buildPropList: function(inControl) {
		var kindName = inControl.kind;
		var currentKind = kindName;

		var definition = this.getKindDefinition(currentKind);
		if (!definition) {
			if (this.debug) { this.log("NO DEFINITION found for '" + currentKind + "' inControl: ", inControl); }
			// Revert to the property and event list extracted from the object
			return this.buildPropListFromObject(inControl);
		}
		
		// If no attributes, bail
		if (!this.userDefinedAttributes[inControl.aresId]) {
			return;
		}

		// TODO: event list must come from the Analyzer output.
		var domEvents = ["ontap", "onchange", "ondown", "onup", "ondragstart", "ondrag", "ondragfinish", "onenter", "onleave"]; // from dispatcher/guesture
		var propMap = {}, eventMap = {};
		while (definition) {
			// Setup helper with current definition
			this.helper.setDefinition(definition);
			
			// Get all published properties for this kind
			var publishedProperties = this.helper.getPublishedWithValues();
			if (this.debug) {
				this.log("buildPropList: publishedProperties", publishedProperties);
			}
			
			// Add an entry to _propMap[]_ for each property found in _publishedProperties_
			for (var i = 0, p; (p = publishedProperties[i]); i++) {
				if (((this.allowed(kindName, "properties", p.name)) || 
					(this.userDefinedAttributes[inControl.aresId].hasOwnProperty(p.name)))) {
					if (this.debug) { this.log("Adding property '" + p.name + "' from '" + currentKind + "'"); }
					propMap[p.name] = p.value;
				}
			}
			
			// Get all events for this kind
			var events = this.helper.getEvents();
			
			// Add an entry to _eventMap[]_ for each event found in _events_
			for (i = 0, p; (p = events[i]); i++) {
				if (((this.allowed(kindName, "events", p)) ||
					(this.userDefinedAttributes[inControl.aresId].hasOwnProperty(p)))) {
					if (this.debug) { this.log("Adding event '" + p + "' from '" + currentKind + "'"); }
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
		
		if (this.debug) { this.log("buildPropList: props", props); }
		return props;
	},
	//* @protected
	buildPropListFromObject: function(inControl) {
		// Get the property and event list from the Object as we cannot get it from the analyzer
		var domEvents = ["ontap", "onchange", "ondown", "onup", "ondragstart", "ondrag", "ondragfinish", "onenter", "onleave"]; // from dispatcher/guesture
		var propMap = {}, eventMap = {};
		var context = inControl;
		var kindName = inControl.kind;
		while (context) {
			for (var p in context.published) {
				if (this.allowed(kindName, "properties", p)) {
					if (this.debug) { this.log("Adding property '" + p + "' from '" + context.kind + "'"); }
					propMap[p] = true;
				}
			}
			for (var e in context.events) {
				if (this.allowed(kindName, "events", e)) {
					if (this.debug) { this.log("Adding event '" + e + "' from '" + context.kind + "'"); }
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
	//* @protected
	makeEditor: function(inControl, inName, inDefaultValue, inType) {
		if(inName === "events") {
			return;
		}
		
		if (this.debug) { this.log("Adding entry for " + inType + " " + inName + " : " + inDefaultValue); }
		
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

		if (inType === 'events') {
			kind = {kind: "Inspector.Config.Event", values: this.kindFunctions};
		}
		
		info = Model.getInfo(inControl.kind, inType, inName);
		kind = (info && info.inputKind) || kind;
		
		// User defined kind: as an Object
		if (kind && kind instanceof Object) {
			kind = enyo.clone(kind);
			kind = enyo.mixin(kind, {name: attributeFieldName, fieldName: inName, fieldValue: value, fieldType: inType, disabled: inherited});
			attributeRow.createComponent(kind);
		} else {
			attributeKind = (kind)
				?	kind
				:	(value === true || value === false || value === "true" || value === "false")
					?	"Inspector.Config.Boolean"
					:	"Inspector.Config.Text";
			
			var values = info ? info.values : null;
			var comp = {name: attributeFieldName, kind: attributeKind, fieldName: inName, fieldValue: value, extra: inType, disabled: inherited};
			
			if (values) {
				comp.values = values;
			}
			
			attributeRow.createComponent(comp);
		}
	},
	//* Set up properties and create the LayoutEditor
	makeLayoutEditor: function(inControl, inPropList) {
		var layoutKinds = this.getLayoutKinds(),
			layoutKindInherited = !(
				inControl.aresId &&
				this.userDefinedAttributes &&
				this.userDefinedAttributes[inControl.aresId] &&
				typeof this.userDefinedAttributes[inControl.aresId]["layoutKind"] !== "undefined"
			),
			layoutKind = (layoutKindInherited) ? "" : this.userDefinedAttributes[inControl.aresId]["layoutKind"],
			controlStyle = (inControl.aresId && this.userDefinedAttributes && this.userDefinedAttributes[inControl.aresId]) ? this.userDefinedAttributes[inControl.aresId].style : null,
			styleProps = (controlStyle) ? this.createStyleArrayFromString(controlStyle) : [],
			properties = {},
			prop,
			row,
			i
		;
		
		// Look for matching properties in current style
		for (i = 0; i < styleProps.length; i++) {
			prop = styleProps[i][0];
			if (prop.match(/position/) || prop.match(/top/) || prop.match(/right/) || prop.match(/bottom/) || prop.match(/left/) || prop.match(/width/) || prop.match(/height/)) {
				properties[prop] = {
					val: styleProps[i][1],
					disabled: false
				}
			}
		}
		
		this.$.content.createComponent(
			{
				name: "layoutEditor",
				kind: "Inspector.LayoutEditor",
				layoutKinds: layoutKinds,
				layoutKind: layoutKind,
				styleProps: properties
			}
		).render();
	},
	//* Return sorted list of all layout kind names from indexer
	getLayoutKinds: function() {
		var layoutKinds = enyo.filter(this.projectIndexer.objects, function(o) {
			return (o.type == "kind") && (o.name == "enyo.Layout" || enyo.indexOf("enyo.Layout", o.superkinds) >= 0);
		});
		
		layoutKinds.push({name: ""}, {name: "AbsolutePositioningLayout"});
		
		layoutKinds.sort(function(a,b) {
			return a.name.localeCompare(b.name);
		});
		
		for (var i = 0; i < layoutKinds.length; i++) {
			layoutKinds[i] = layoutKinds[i].name;
		}
		
		return layoutKinds;
	},
	positionPropertyChanged: function(inSender, inEvent) {
		var controlStyle = (this.selected.aresId && this.userDefinedAttributes && this.userDefinedAttributes[this.selected.aresId]) ? this.userDefinedAttributes[this.selected.aresId].style : null,
			// Get this control's style as an array
			styleProps = (controlStyle) ? this.createStyleArrayFromString(controlStyle) : [],
			originator = this.getAttributeVal(inEvent.target),
			n = originator.fieldName,
			v = originator.fieldValue,
			match = false,
			prop
		;
		
		// Look for matching properties in current style
		for (i = 0; i < styleProps.length; i++) {
			prop = styleProps[i][0];
			if (prop.match(n)) {
				if (v === "") {
					styleProps.splice(i, 1);
				} else {
					styleProps[i][1] = v;
				}
				
				match = true;
				break;
			}
		}
		
		// If match not found, add the new style
		if (!match && v !== "") {
			styleProps.push([n, v])
		}
		
		// Update event values
		originator.fieldName = "style";
		originator.fieldValue = this.createStyleStringFromArray(styleProps);
		
		// Pass on to _change()_ function
		this.change(inSender, enyo.mixin(inEvent, {target: originator}));
		
		return true;
	},
	createStyleArrayFromString: function(inStyleStr) {
		var styleProps = inStyleStr.split(";");
		
		for (var i = 0; i < styleProps.length; i++) {
			styleProps[i] = styleProps[i].split(":");
			if (styleProps[i].length <= 1) {
				styleProps.splice(i,1);
				i--;
				continue;
			}
			
			// Trim whitespace from prop and val
			styleProps[i][0] = this.trimWhitespace(styleProps[i][0]);
			styleProps[i][1] = this.trimWhitespace(styleProps[i][1]);
		}
		
		return styleProps;
	},
	createStyleStringFromArray: function(inStyleArray) {
		var styleStr = "",
			i;
		
		// Compose style string
		for (i = 0; i < inStyleArray.length; i++) {
			if (i > 0) {
				styleStr += " ";
			}
			
			styleStr += inStyleArray[i][0] + ": " + inStyleArray[i][1] + ";";
		}
		
		return styleStr;
	},
	trimWhitespace: function(inStr) {
		return inStr.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	},
	//* Set the requested position value
	setRequestedPositionValue: function(inProp, inValue) {
		this.waterfall("onSetRequestedPositionValue", {prop: inProp, value: inValue});
	},
	inspect: function(inControl) {
		var ps, i, p;

		if (!inControl) {
			return;
		}

		this.$.content.destroyComponents();
		this.selected = inControl;
		
		var kindName = inControl.name + " (" + inControl.kind + ")";
		this.$.content.createComponent({tag: "h3", content: kindName, classes: "label label-info"});
		ps = this.buildPropList(inControl);
		
		// If no properties list, bail
		if (!ps) {
			return;
		}

		switch(this.filterType) {
			case 'P':
				this.$.content.createComponent({classes: "onyx-groupbox-header", content: "Properties"});
				for (p in ps) {
					this.makeEditor(inControl, p, ps[p], "properties");
				}
				this.$.filterLevel.show();
				break;
			case 'E':
				ps = ps.events;
				if (ps.length) {
					this.$.content.createComponent({classes: "onyx-groupbox-header", content: "Events"});
				}
				for (i=0, p; (p=ps[i]); i++) {
					this.makeEditor(inControl, p, "", "events");
				}
				this.$.filterLevel.show();
				break;
			case 'S':
				var style = "";
				if (inControl && inControl.style !== undefined) {
					style = inControl.style;
				}
				this.$.content.createComponent({kind: "CssEditor", currentControlStyle: style});
				this.$.filterLevel.hide();
				break;
			case 'L':
				this.makeLayoutEditor(inControl, ps);
				this.$.filterLevel.hide();
				break;
			default:
				enyo.warn("Inspector has unknown filterType: ", filterType);
				break;
		}
		
		this.$.content.render();
		// Resize to adjust content container height for filterLevel hide/show
		this.resized();
	},
	//* @protected
	change: function(inSender, inEvent) {
		if (!inEvent.target) {
			return true;
		}

		var n = inEvent.target.fieldName;
		var v = inEvent.target.fieldValue;
		var num = parseFloat(v);

		if (String(num) == v) {
			v = num;
		}

		if (this.debug) { this.log("Set property: " + n + " --> ", v); }

		// Save each change to _this.userDefinedAttributes_
		if(!this.userDefinedAttributes[this.selected.aresId]) {
			this.userDefinedAttributes[this.selected.aresId] = {};
		}

		if (v === "") {
			delete this.userDefinedAttributes[this.selected.aresId][n];
		} else {
			this.userDefinedAttributes[this.selected.aresId][n] = v;			
		}
		
		this.doModify({name: n, value: v, type: inEvent.target.fieldType});
		
		return true;
	},
	//* Recurse through parents to find config control
	getAttributeVal: function(inComponent) {
		if (inComponent instanceof Inspector.Config.IF) {
			return inComponent;
		} else if (inComponent.parent) {
			return this.getAttributeVal(inComponent.parent);
		}
	},
	dblclick: function(inSender, inEvent) {
		if (inEvent.target.fieldType === "events") {
			var n = inEvent.target.fieldName;
			var v = inEvent.target.fieldValue;
			if (!v) {
				v = this.selected.name + enyo.cap(n.slice(2));
				if (this.debug) { this.log("SET handler: " + n + " --> " + v); }
				inEvent.target.setFieldValue(v);
				this.change(inSender, inEvent);
			}
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
		if (oldProjectData) {
			oldProjectData.off('change:project-indexer', this.projectIndexReady);
			oldProjectData.off('update:project-indexer', this.projectIndexUpdated);
			Model.resetInformation();
		}

		if (this.projectData) {
			if (this.debug) { this.log("projectDataChanged: projectData", this.projectData); }
			this.projectData.on('change:project-indexer', this.projectIndexReady, this);
			this.projectData.on('update:project-indexer', this.projectIndexUpdated, this);
			this.setProjectIndexer(this.projectData.getProjectIndexer());
			Model.buildInformation(this.projectIndexer);
		}
	},
	/**
	 * The project analyzer output has changed
	 * @param value   the new analyzer output
	 * @protected
	 */
	projectIndexReady: function(model, value, options) {
		if (this.debug) { this.log("projectIndexReady: ", value); }
		this.setProjectIndexer(value);
	},
	//* @protected
	projectIndexUpdated: function() {
		if (this.debug) { this.log("projectIndexUpdated: for projectIndexer: ", this.projectIndexer); }
		Model.buildInformation(this.projectIndexer);
	},
	//* @public
	initUserDefinedAttributes: function(inComponents) {
		this.userDefinedAttributes = {};
		
		var components = this.flattenComponents(inComponents);
		
		for(var i = 0, component; (component = components[i]); i++) {
			this.userDefinedAttributes[component.aresId] = component;
		}
	},
	//* @protected
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
	 * @protected
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
			this.setFilterLevel(inEvent.originator.value);
			this.inspect(this.selected);
		}
		return true;
	},
	//* @protected
	updateFilterType: function(inSender, inEvent) {
		if (inEvent.active) {
			this.setFilterType(inEvent.originator.value);
			this.inspect(this.selected);
		}
		return true;
	},
	//* When an inherit checkbox is toggled, enable/disable the attribute
	//* @protected
	inheritAttributeToggle: function(inSender, inEvent) {
		var originator = inEvent.originator,
			row = originator.parent,
			attribute = originator.prop,
			attributeVal;
		
		if (!row.$.attributeVal) {
			return;
		}
		
		// Make sure this attribute exists in _this.userDefinedAttributes_
		if (!this.userDefinedAttributes[this.selected.aresId]) {
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
	},
	//* @public
	setCurrentKindName: function(kindname) {
		var definition = this.getKindDefinition(kindname);
		this.helper.setDefinition(definition);

		// Get the list of handler methods
		this.kindFunctions = this.helper.getFunctions().sort();
	}
});

enyo.kind({
	name: "Inspector.FilterLevel",
	events: {
		onValueChanged: ""
	},
	components: [
		{kind: "onyx.RadioGroup", fit: false, onActivate: "filterLevelActivated", style: "display:block;", controlClasses: "onyx-tabbutton inspector-tabbutton thirds", components: [
			{value: Model.F_USEFUL,    content: "Frequent"},
			{value: Model.F_NORMAL,    content: "Normal", active: true},
			{value: Model.F_DANGEROUS, content: "All"}
		]}
	],
	filterLevelActivated: function(inSender, inEvent) {
		// Only bubble valueChanged event if the originator is now active
		if (inEvent.originator.active) {
			this.doValueChanged({active: true, originator: inEvent.originator});
		}
		
		return true;
	}
});

enyo.kind({
	name: "Inspector.FilterType",
	events: {
		onValueChanged: ""
	},
	components: [
		{kind: "onyx.RadioGroup", fit: false, onActivate: "filterTypeActivated", style: "display:block;", controlClasses: "onyx-tabbutton inspector-tabbutton fourths", components: [
			{content:"Properties", value: "P", active:true},
			{content:"Events", value: "E"},
			{content:"Layout", value: "L"},
			{content:"Style", value: "S"}
		]}
	],
	filterTypeActivated: function(inSender, inEvent) {
		// Only bubble valueChanged event if the originator is now active
		if (inEvent.originator.active) {
			this.doValueChanged({active: true, originator: inEvent.originator});
		}
		
		return true;
	}
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

enyo.kind({
	name: "Inspector.LayoutEditor",
	kind: "enyo.Control",
	published: {
		//* Current _layoutKind_ property for selected control
		layoutKind: null,
		//* Array of all possible _layoutKind_ values
		layoutKinds: null,
		//* Current layout-related style properties for selected control
		styleProps: null,
		//* Default values for layout-related style properties
		defaultStyleProps: {
			position : {
				val: "static",
				disabled: false
			},
			top : {
				val: "",
				disabled: true
			},
			left : {
				val: "",
				disabled: true
			},
			bottom : {
				val: "",
				disabled: true
			},
			right : {
				val: "",
				disabled: true
			},
			width : {
				val: "",
				disabled: true
			},
			height : {
				val: "",
				disabled: true
			}
		}
	},
	events: {
		onRequestPositionValue: "",
		onPositionDataUpdated: "",
		onPositionPropertyChanged: ""
	},
	handlers: {
		onSetRequestedPositionValue: "setRequestedPositionValue"
	},
	components: [
		{classes: "onyx-groupbox-header", content: "Layout Kind"},
		{name: "layoutKindRow", classes: "ares-inspector-row"},
		{classes: "onyx-groupbox-header", content: "Position"},
		{name: "positionEditorContainer", onUpdateProps: "handleUpdateProps"},
		{classes: "onyx-groupbox-header", content: "Properties"}
	],
	//* @protected
	create: function() {
		//* Do whatchya gotta do
		this.inherited(arguments);
		//* Create initial _this.styleProps_ values
		this.setupStyleProps();
		//* Add the _layoutKind_ picker
		this.createLayoutKindPicker();
		//* Add the position editor
		this.createPositionEditor();
		//* Create a text field for each property in _styleProps_
		this.createPropertyFields();
	},
	//* Create a picker for the _layoutKind_ property
	createLayoutKindPicker: function() {
		this.$.layoutKindRow.createComponent({
			name: 		"attributeVal-layoutKind",
			kind: 		"Inspector.Config.Select",
			classes: 	"layout-kind-select",
			fieldName: 	"layoutKind",
			fieldValue: this.getLayoutKind(),
			values: 	this.getLayoutKinds(),
			disabled: 	false
		});
	},
	//* Fill in any missing properties from _this.styleProps_ with _this.defaultStyleProps_
	setupStyleProps: function() {
		var defaultProps = enyo.clone(this.getDefaultStyleProps()),
			props = enyo.clone(this.getStyleProps()),
			returnProps = {},
			prop
		;
		
		// Go through each default, and if it doesn't exist in _this.styleProps_, use the default
		for (prop in defaultProps) {
			returnProps[prop] = (props[prop]) ? enyo.clone(props[prop]) : enyo.clone(defaultProps[prop]);
		}
		
		this.setStyleProps(enyo.clone(returnProps));
	},
	//* Create an instance of _Inspector.PositionEditor_ passing in _this.styleProps_
	createPositionEditor: function() {
		this.$.positionEditorContainer.createComponent({
			kind: "Inspector.PositionEditor",
			name: "positionEditor",
			props: this.getStyleProps()
		});
	},
	//* Create property text fields for each property in _this.styleProps_
	createPropertyFields: function() {
		var properties = this.getStyleProps(),
			prop,
			row
		;
		
		for (prop in properties) {
			row = this.createComponent({classes: "ares-inspector-row"});
			row.createComponent(
				{
					name: 		"attributeVal-" + prop,
					kind: 		"Inspector.Config.Text",
					fieldName: 	prop,
					fieldValue: properties[prop].val,
					disabled: 	properties[prop].disabled,
					onChange: 	"positionPropertyChanged"
				},
				{owner: this}
			);
		}
	},
	positionPropertyChanged: function(inSender, inEvent) {
		this.doPositionPropertyChanged(inEvent);
		return true;
	},
	//* Catch _onUpdateProps_ event sent from position editor
	handleUpdateProps: function(inSender, inEvent) {
		var $field,
			requestData,
			focused
		;
		
		for(var i = 0, prop; (prop = inEvent.changedProps[i]); i++) {
			$field = this.$["attributeVal-" + prop];
			if (inEvent.props[prop].disabled) {
				$field.setDisabled(true);
				$field.setFieldValue("");
			} else {
				$field.setDisabled(false);
				if (inEvent.changedSide === prop && inEvent.changedProps.length <= 1) {
					focused = true;
				} else {
					requestData = {prop: prop};
				}
			}
		}
		
		if (requestData) {
			this.doRequestPositionValue(requestData);
		} else if (!focused) {
			this.dataPositionUpdated();
		}
		
		return true;
	},
	//* Set the auto-generated field value for the specified property
	setRequestedPositionValue: function(inSender, inEvent) {
		var $field = this.$["attributeVal-" + inEvent.prop];
		$field.setFieldValue(inEvent.value + "px");
		this.dataPositionUpdated();
	},
	//* Update position data
	dataPositionUpdated: function() {
		var $field,
			value,
			props = {
				top: "",
				right: "",
				bottom: "",
				left: "",
				height: "",
				width: ""
			}
		;
	
		for (var prop in props) {
			$field = this.$["attributeVal-" + prop];
			value = $field.getFieldValue();
			props[prop] = value;
		}
		
		this.doPositionDataUpdated({props: props});
	}
});

enyo.kind({
	name: "Inspector.PositionEditor",
	classes: "ares-inspector-position-editor",
	published: {
		props:  null
	},
	events: {
		onUpdateProps: ""
	},
	components: [
		{name: "topToggle", classes: "top-toggle anchor-toggle", side: "top", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		{name: "rightToggle", classes: "right-toggle anchor-toggle", side: "right", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		{name: "bottomToggle", classes: "bottom-toggle anchor-toggle", side: "bottom", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		{name: "leftToggle", classes: "left-toggle anchor-toggle", side: "left", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		{name: "innerBox", classes: "ares-inspector-position-editor-inner-box", components: [
			{name: "widthToggle", classes: "width-toggle anchor-toggle", side: "width", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
			{name: "heightToggle", classes: "height-toggle anchor-toggle", side: "height", components: [{classes: "anchor-line"}], ontap: "toggleSide"},
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.propsChanged();
	},
	propsChanged: function() {
		this.topChanged();
		this.rightChanged();
		this.bottomChanged();
		this.leftChanged();
		this.widthChanged();
		this.heightChanged();
	},
	topChanged: function() {
		this.$.topToggle.getClientControls()[0].addRemoveClass("disabled", this.props.top.disabled);
	},
	rightChanged: function() {
		this.$.rightToggle.getClientControls()[0].addRemoveClass("disabled", this.props.right.disabled);
	},
	bottomChanged: function() {
		this.$.bottomToggle.getClientControls()[0].addRemoveClass("disabled", this.props.bottom.disabled);
	},
	leftChanged: function() {
		this.$.leftToggle.getClientControls()[0].addRemoveClass("disabled", this.props.left.disabled);
	},
	widthChanged: function() {
		this.$.widthToggle.getClientControls()[0].addRemoveClass("disabled", this.props.width.disabled);
	},
	heightChanged: function() {
		this.$.heightToggle.getClientControls()[0].addRemoveClass("disabled", this.props.height.disabled);
	},
	toggleSide: function(inSender, inEvent) {
		var side = inSender.side,
			props = this.props,
			changedProps = [side]
		;
		
		props[side].disabled = !props[side].disabled;
		
		switch (side) {
			case "top":
				if (props.top.disabled) {
					// Top: off, Bottom: off --> Bottom: on
					if (props.bottom.disabled) {
						props.bottom.disabled = false;
						changedProps.push("bottom");
					// Top: off, Bottom: on, Height: off --> Height: on
					} else if (props.height.disabled) {
						props.height.disabled = false;
						changedProps.push("height");
					}
				} else {
					if (!props.bottom.disabled) {
						// Top: on, Bottom: on, Height: on --> Height: off
						if (!props.height.disabled) {
							props.height.disabled = true;
							changedProps.push("height");
						}
					}
				}
				break;
			case "right":
				if (props.right.disabled) {
					// Right: off, Left: off --> Left: on
					if (props.left.disabled) {
						props.left.disabled = false;
						changedProps.push("left");
					// Right: off, Left: on, Width: off --> Width: on
					} else if (props.width.disabled) {
						props.width.disabled = false;
						changedProps.push("width");
					}
				} else {
					if (!props.left.disabled) {
						// Right: on, Left: on, Width: on --> Width: off
						if (!props.width.disabled) {
							props.width.disabled = true;
							changedProps.push("width");
						}
					}
				}
				break;
			case "bottom":
				// Bottom: off, Top: off --> Top: on
				if (props.bottom.disabled) {
					if (props.top.disabled) {
						props.top.disabled = false;
						changedProps.push("top");
					// Bottom: off, Top: on, Height: off --> Height: on
					} else if (props.height.disabled) {
						props.height.disabled = false;
						changedProps.push("height");
					}
				} else {
					if (!props.top.disabled) {
						// Bottom: on, Top: on, Height: on --> Height: off
						if (!props.height.disabled) {
							props.height.disabled = true;
							changedProps.push("height");
						}
					}
				}
				break;
			case "left":
				if (props.left.disabled) {
					// Left: off, Right: off --> Right: on
					if (props.right.disabled) {
						props.right.disabled = false;
						changedProps.push("right");
					// Left: off, Right: on, Width: off --> Width: on
					} else if (props.width.disabled) {
						props.width.disabled = false;
						changedProps.push("width");
					}
				} else {
					if (!props.right.disabled) {
						// Left: on, Right: on, Width: on --> Width: off
						if (!props.width.disabled) {
							props.width.disabled = true;
							changedProps.push("width");
						}
					}
				}
				break;
			case "width":
				if (props.width.disabled) {
					// Width: off, Left: off --> Left: on
					if (props.left.disabled) {
						props.left.disabled = false;
						changedProps.push("left");
					}
					// Width: off, Right: off --> Right: on
					if (props.right.disabled) {
						props.right.disabled = false;
						changedProps.push("right");
					}
				} else {
					if (!props.left.disabled) {
						// Width: on, Left: on, Right: on --> Right: off
						if (!props.right.disabled) {
							props.right.disabled = true;
							changedProps.push("right");
						}
					}
				}
				break;
			case "height":
				if (props.height.disabled) {
					// Height: off, Top: off --> Top: on
					if (props.top.disabled) {
						props.top.disabled = false;
						changedProps.push("top");
					}
					// Height: off, Bottom: off --> Bottom: on
					if (props.bottom.disabled) {
						props.bottom.disabled = false;
						changedProps.push("bottom");
					}
				} else {
					if (!props.top.disabled) {
						// Height: on, Top: on, Bottom: on --> Bottom: off
						if (!props.bottom.disabled) {
							props.bottom.disabled = true;
							changedProps.push("bottom");
						}
					}
				}
				break;
			default:
				break;
		}
		
		 this.propsChanged();
		 this.doUpdateProps({changedSide: side, changedProps: changedProps, props: props});
	}
});

