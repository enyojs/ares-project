/*global analyzer, ProjectKindsModel, Inspector, ares, enyo, Ares */

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
		projectIndexer: null	// Analyzer output for the current project
	},
	components: [
		{kind: "Inspector.FilterType", onValueChanged: "updateFilterType"},
		{kind: "Scroller", fit: true, components: [
			{name: "content", kind: "FittableRows", onActivate: "inheritAttributeToggle"}
		]},
		{name: "filterLevel", kind: "Inspector.FilterLevel", onValueChanged: "updateFilterLevel"},
		{name: "partialFilter", kind: "onyx.InputDecorator", classes: "properties-filter", layoutKind: "FittableColumnsLayout", showing: false, components: [
			{kind: "onyx.Input", name: "filterProperties", fit: true, placeholder: "filter", oninput: "propertiesFiltering"},
			{kind: "onyx.Icon", classes: "filter-icon", name: "filterPropertiesIcon", src: "$assets/enyo-editor/deimos/images/search-input-search.png", ontap: "resetFilter"}
		]},
		{name: "selectFilePopup", kind: "Ares.FileChooser", classes:"ares-masked-content-popup", showing: false, folderChooser: false, allowToolbar: false, onFileChosen: "selectFileChosen"}
	],
	handlers: {
		onChange: "change",
		onDblClick: "dblclick",
		onPositionPropertyChanged: "positionPropertyChanged",
		onInputButtonTap: "selectFile",
		onPathChecked: "handlePathChecked"
	},
	classes: "inspector-panel",
	debug: false,
	helper: null,			// Analyzer.KindHelper
	userDefinedAttributes: {},
	//* @protected
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.helper = new analyzer.Analyzer.KindHelper();
		
		//* TODO - should be moved to KindHelper.js.
		this.helper.getPublishedWithValues = function() {
			this.checkDefAvail();
			var published = [];

			var obj = this.definition.properties;
			for (var i=0; i<obj.length; i++) {
				if (obj[i].token === "published") {
					var p = obj[i].value[0].properties;
					for (var j=0; j < p.length; j++) {
						if (p[j].value[0].type != "array") {
							var val = "";
							try {
								// TODO - shouldn't have to eval() here. Strings come back with double double quotes ("""")
								/* jshint evil: true */
								val = eval(p[j].value[0].token); // TODO: ENYO-2074, replace eval.
								/* jshint evil: false */
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
		};
	},
	//* @protected
	allowed: function(inKindName, inType, inName) {
		var level = ProjectKindsModel.getFilterLevel(inKindName, inType, inName);
		this.trace("Level: ", level, " for ", inKindName, ".", inName);	
		return level >= this.filterLevel;
	},
	//* Return complete list of published properties for _inControl_
	//* @protected
	buildPropList: function(inControl) {
		var kindName = inControl.kind;
		var currentKind = kindName;

		var definition = this.getKindDefinition(currentKind);
		if (!definition) {
			this.trace("NO DEFINITION found for '", currentKind, "' inControl: ", inControl);
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
			this.trace("buildPropList: publishedProperties", publishedProperties);
			
			// Add an entry to _propMap[]_ for each property found in _publishedProperties_
			for (var i = 0, p; (p = publishedProperties[i]); i++) {
				if (((this.allowed(kindName, "properties", p.name)) || 
					 (this.userDefinedAttributes[inControl.aresId].hasOwnProperty(p.name)))) {
					this.trace("Adding property '", p.name, "' from '", currentKind, "'");
					propMap[p.name] = p.value;
				}
			}
			
			// Get all events for this kind
			var events = this.helper.getEvents();
			
			// Add an entry to _eventMap[]_ for each event found in _events_
			for (i = 0, p; (p = events[i]); i++) {
				if (((this.allowed(kindName, "events", p)) ||
					 (this.userDefinedAttributes[inControl.aresId].hasOwnProperty(p)))) {
					this.trace("Adding event '", p, "' from '", currentKind, "'");
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
		for (var n in eventMap) {
			props.events.push(n);
		}
		for (n=0; n < domEvents.length; n++) {
			if (this.allowed(kindName, "events", domEvents[n])) {
				props.events.push(domEvents[n]);
			}
		}
		
		this.trace("buildPropList: props", props);
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
					this.trace("Adding property '", p, "' from '", context.kind, "'");
					propMap[p] = true;
				}
			}
			for (var e in context.events) {
				if (this.allowed(kindName, "events", e)) {
					this.trace("Adding event '", e, "' from '", context.kind, "'");
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
	//* @protected
	makeEditor: function(inControl, inName, inDefaultValue, inType) {
		if(inName === "events") {
			return;
		}
		
		this.trace("Adding entry for ", inType, " ", inName, " : ", inDefaultValue);
		
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

		info = ProjectKindsModel.getInfo(inControl.kind, inType, inName);
		kind = (info && info.inputKind) || kind;
		
		if(inName === 'src'){
			kind = {kind: "Inspector.Config.PathInputRow", label : inName};
		}
		if (kind && kind instanceof Object) {
			kind = enyo.clone(kind);
			kind = enyo.mixin(kind, {name: attributeFieldName, fieldName: inName, fieldValue: value, fieldType: inType, disabled: inherited});
			attributeRow.createComponent(kind);
			if (kind.kind === "Inspector.Config.PathInputRow" && kind.fieldValue) {
				this.checkPath(attributeRow.$[attributeFieldName], kind.fieldValue);	
			}
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
	makeLayoutEditor: function(inControl) {
		var positionProperties = ["position", "top", "right", "bottom", "left", "width", "height"],
			styleProps = {},
			properties = {},
			prop,
			i
		;
		
		enyo.Control.cssTextToDomStyles(this.trimWhitespace(this.getControlStyle(inControl)), styleProps);
		
		for (i = 0; (prop = positionProperties[i]); i++) {
			if (styleProps[prop]) {
				properties[prop] = {
					val: styleProps[prop],
					disabled: false
				};
			}
		}
		
		this.$.content.createComponent(
			{
				name: "layoutEditor",
				kind: "Inspector.LayoutEditor",
				layoutKinds: this.getLayoutKinds(),
				layoutKind: this.getControlLayoutKind(inControl),
				styleProps: properties
			}
		).render();
	},
	trimWhitespace: function(inStr) {
		inStr = inStr || "";
		return inStr.replace(/\s/g, "");
	},
	//* Return the style string held in _this.userDefinedAttributes_ for _inControl_
	getControlStyle: function(inControl) {
		return (inControl.aresId && this.userDefinedAttributes && this.userDefinedAttributes[inControl.aresId])
			?	this.userDefinedAttributes[inControl.aresId].style
			:	null;
	},
	//* Get the layoutKind value for _inControl_
	getControlLayoutKind: function(inControl) {
		var inherited = !(
			inControl.aresId &&
				this.userDefinedAttributes &&
				this.userDefinedAttributes[inControl.aresId] &&
				typeof this.userDefinedAttributes[inControl.aresId]["layoutKind"] !== "undefined"
		)
		;
		
		return (inherited) ? "" : this.userDefinedAttributes[inControl.aresId]["layoutKind"];
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
			styleProps = {},
			originator = this.getAttributeVal(inEvent.target),
			n = originator.fieldName,
			v = originator.fieldValue;
		
		enyo.Control.cssTextToDomStyles(controlStyle, styleProps);
		styleProps[n] = " "+v;
		
		// Update event values
		originator.fieldName = "style";
		originator.fieldValue = enyo.Control.domStylesToCssText(styleProps);
		
		// Pass on to _change()_ function
		this.change(inSender, enyo.mixin(inEvent, {target: originator}));
		
		return true;
	},
	//* Set the requested position value
	setRequestedPositionValue: function(inProp, inValue) {
		this.waterfall("onSetRequestedPositionValue", {prop: inProp, value: inValue});
	},
	inspect: function(inControl) {
		var ps, i, p;

		this.$.content.destroyComponents();
		if (!inControl) {
			return;
		}
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
			this.$.partialFilter.show();
			this.propertiesFiltering();
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
			this.$.partialFilter.hide();
			break;
		case 'S':
			var style = "";
			if (inControl && inControl.style !== undefined) {
				style = inControl.style;
			}
			this.$.content.createComponent({kind: "CssEditor", currentStyle: style, inspectorObj: this});
			this.$.filterLevel.hide();
			this.$.partialFilter.hide();
			break;
		case 'L':
			this.makeLayoutEditor(inControl);
			this.$.filterLevel.hide();
			this.$.partialFilter.hide();
			break;
		default:
			enyo.warn("Inspector has unknown filterType: ", this.filterType);
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

		this.trace("Set property: ", n, " --> ", v);

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
				this.trace("SET handler: ", n, " --> ", v);
				inEvent.target.setFieldValue(v);
				this.change(inSender, inEvent);
			}
		}
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
			attribute = originator.prop;
		
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
			
			// Remove this attribute from the rendered instance in the designerFrame by setting it to _undefined_
			this.doModify({name: attribute, value: undefined});
		}
	},
	//* @public
	setCurrentKindName: function(kindname) {
		var definition = this.getKindDefinition(kindname);
		this.helper.setDefinition(definition);

		// Get the list of handler methods
		this.kindFunctions = this.helper.getFunctions().sort();
	},
	//* @private
	propertiesFiltering: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		if (this.$.filterProperties.getValue() === "") {
			this.$.filterPropertiesIcon.set("src", "$assets/enyo-editor/deimos/images/search-input-search.png");
		} else {
			this.$.filterPropertiesIcon.set("src", "$assets/enyo-editor/deimos/images/search-input-cancel.png");
		}
		this.filterProperties();

		return true;
	},
	//* @private
	filterProperties: function() {
		var allProperties = this.$.content.getControls();
		var filterString = this.$.filterProperties.getValue().toLowerCase();
		enyo.forEach(allProperties, function(row) {
			row.show();
			if (filterString !== "") {
				var controls = row.getControls();
				if(controls.length){
					enyo.forEach(controls, function(control) {
						var fieldName = control.fieldName;
						if(fieldName){
							if(fieldName.toLowerCase().indexOf(filterString) === -1){
								row.hide();
							}
						}
					}, this);
				}
			}
		}, this);
	},
	//* @private
	resetFilter: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		if (this.$.filterProperties.getValue() !== "") {
			this.$.filterProperties.setValue("");
			this.propertiesFiltering();
		}
		return true;
	},
	selectFile: function(inSender, inData) {
		this.trace(inSender, "=>", inData);
		var project = Ares.Workspace.projects.getActiveProject();
		this.chooser = inData.originator;
		this.$.selectFilePopup.reset();
		this.$.selectFilePopup.connectProject(project, (function() {
			this.$.selectFilePopup.setHeaderText(inData.header);
			this.$.selectFilePopup.pointSelectedName(inData.originator.getValue(), inData.originator.getStatus());
			this.$.selectFilePopup.show();
		}).bind(this));
		return true;
	},
	/** @private */
	selectFileChosen: function(inSender, inEvent) {
		var chooser = this.chooser;
		this.chooser = null;
		if (!inEvent.file) {
			// no file or folder chosen			
			return true;
		}
		var value = inEvent.name.substr(1);
		chooser.setFieldValue(value);
		chooser.handleChange();
		this.$.selectFilePopup.reset();
		return true;
	},
	checkPath: function (pathComponent, value) {
		this.checker = pathComponent;
		if (value.match(/^https?:\/\//)){
			this.pathChecked(true);
			return true;
		}
		if (value.match(/^[\.\/]/)){
			this.pathChecked(false);
			return true;
		}
		var project = Ares.Workspace.projects.getActiveProject();
		this.$.selectFilePopup.connectProject(project, (function() {
			this.$.selectFilePopup.checkSelectedName("/"+value);
		}).bind(this));		
	},
	handlePathChecked: function(inSender, inData){
		this.pathChecked(inData.status);
	},
	/** @private */
	pathChecked: function (status) {
		var checker = this.checker;
		this.checker = null;
		this.$.selectFilePopup.reset();
		this.updatePathCheck(checker, status);
	},
	updatePathCheck: function(pathComponent, status) {
		pathComponent.setStatus(status);
		pathComponent.disableFileChooser(false);
		return true;
	}
});

enyo.kind({
	name: "Inspector.FilterLevel",
	events: {
		onValueChanged: ""
	},
	components: [
		{kind: "onyx.RadioGroup", fit: false, onActivate: "filterLevelActivated", controlClasses: "onyx-tabbutton inspector-tabbutton filter thirds", components: [
			{value: ProjectKindsModel.F_USEFUL,    content: "Frequent"},
			{value: ProjectKindsModel.F_NORMAL,    content: "Normal", active: true},
			{value: ProjectKindsModel.F_DANGEROUS, content: "All"}
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

