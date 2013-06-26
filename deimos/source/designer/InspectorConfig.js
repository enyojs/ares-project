/**
 * This "abstract" kind defines the interface needed for the
 * sub-kinds used by the Inspector to configure properties
 * and events
 *
 * Sub-kind will be instanciated with the properties listed below in
 * "published" section and must issue a "onChange" event with "target"
 * property referencing itself (See Inspector.Config.Boolean)
 * when their value is changed.
 *
 * The based kind "Inspector.Config.IF" expects a sub-component
 * named "title" to hold the property/event name and a sub-component
 * named "value" to hold the corresponding value.
 *
 * Sub-kind could also issue a "onDblClick" event with "target"
 * property referencing itself (See Inspector.Config.Text) for
 * events
 *
 * Sub-kind must override "fieldValueChanged" if more complex
 * processing is needed (See Inspector.Config.Select).
 */
enyo.kind({
	name: "Inspector.Config.IF",
	events : {
		onChange: "",
		onDblClick: ""
	},
	published: {
		fieldName: "",
		fieldValue: "",
		fieldType: "",
		disabled: false
	},
	create: function() {
		this.inherited(arguments);
		this.fieldNameChanged();
		this.fieldValueChanged();
		this.disabledChanged();
	},
	fieldNameChanged: function() {
		this.$.title.setContent(this.fieldName);
	},
	fieldValueChanged: function() {
		this.$.value.setValue(this.fieldValue);
	},
	disabledChanged: function() {
		this.$.value.setDisabled(this.getDisabled());
	}
});

enyo.kind({
	name: "Inspector.Config.Boolean",
	kind: "Inspector.Config.IF",
	// events and published are defined by the base kind
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "enyo.Checkbox", classes: "inspector-field-checkbox", name: "value", onActivate: "handleChange"}
	],
	allowActivate: false,
	rendered: function() {
		this.inherited(arguments);
		this.allowActivate = true;
	},
	handleChange: function(inSender, inEvent) {
		if(!this.allowActivate) {
			return true;
		}
		this.fieldValue = this.$.value.getChecked();
		this.doChange({target: this});
		return true;
	}
});

/**
 * This kind generates a "onDblClick" event usable for events
 * edition.
 */
enyo.kind({
	name: "Inspector.Config.Text",
	kind: "Inspector.Config.IF",
	// events and published are defined by the base kind
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "enyo.Input", classes: "inspector-field-editor", name: "value", onchange: "handleChange", ondblclick: "handleDblClick"}
	],
	
	//* @public
	
	//* Facade for _enyo.Input.focus()_
	focus: function() {
		this.$.value.focus();
	},
	
	//* @protected
	
	//* Stop extraneous activate event from being fired when box is initially checked
	handleChange: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doChange({target: this});
		return true;
	},
	handleDblClick: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doDblClick({target: this});
		return true;
	}
});

/**
 * This kind generates a "onDblClick" event usable for events
 * edition.
 */
enyo.kind({
	name: "Inspector.Config.Event",
	kind: "Inspector.Config.IF",
	// events and published are defined by the base kind
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "onyx.MenuDecorator", onSelect: "itemSelected", components: [
				{kind: "enyo.Input", classes: "inspector-field-editor", name: "value", onchange: "handleChange", ondblclick: "handleDblClick"},
				{kind: "enyo.Button", name: "button", classes:"inspector-event-button"},
				{kind: "onyx.Menu", name: "menu", floating: true, components: [
					// Will be filled at create() time
				]}
			]}
	],
	handlers: {
		onActivate: "preventMenuActivation"
	},
	fieldValueChanged: function() {
		enyo.forEach(this.values, function(value) {
			this.$.menu.createComponent({content: value, classes: "event-menu-item"});
		}, this);
		this.$.value.setValue(this.fieldValue);
	},
	preventMenuActivation: function(inSender, inEvent) {
		return true;
	},
	//* Stop extraneous activate event from being fired when box is initially checked
	handleChange: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doChange({target: this});
		return true;
	},
	handleDblClick: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doDblClick({target: this});
		return true;
	},
	itemSelected: function(inSender, inEvent) {
		this.fieldValue = inEvent.content;
		this.$.value.setValue(inEvent.content);
		this.doChange({target: this});
		return true;
	},
	disabledChanged: function() {
		this.inherited(arguments);
		this.$.button.setDisabled(this.getDisabled());
	}
});

enyo.kind({
	name: "Inspector.Internal.Select",
	published: {
		fieldValue: "",
		disabled: false
	},
	handlers: {
		onChange: "handleChange"
	},
	// events and published are defined by the base kind
	// values: Must be defined in the configuration
	components: [
		{name: "decorator", kind: "onyx.PickerDecorator"}
	],
	initComponents: function() {
		this.initFinished = false;
		this.inherited(arguments);
		
		var components = [],
			selected,
			i;
		
		for (i = 0; i < this.values.length; i++) {
			selected = (this.values[i] === this.fieldValue);
			components.push({content: this.values[i], value: this.values[i], active: selected});
		}
		
		this.$.decorator.createComponents([
			{name: "pickerButton"},
			{kind: "onyx.Picker", classes: "inspector-field-editor", name: "value", components: components}
		], {owner: this});

		this.initFinished = true;
	},
	disabledChanged: function() {
		this.$.pickerButton.setDisabled(this.getDisabled());
	},
	fieldValueChanged: function() {
		this.updateSelected();
	},
	handleChange: function(inSender, inEvent) {
		if ( ! this.initFinished) {
			return true;
		}
		this.setFieldValue(this.$.value.getSelected().value);
	},
	updateSelected: function() {
		var selectedIndex = Math.max(0, this.values.indexOf(this.fieldValue));
		var selected = this.$.value.getClientControls()[selectedIndex];
		this.initFinished = false;
		this.$.value.setSelected(selected);
		this.initFinished = true;
	}
});

/**
 * This kind allows to select a value defined in the
 * "values" property of this kind.
 *
 * The values must be specified in the configuration file (base-design.js or design.js)
 * If "fieldValue" does not match an entry from "values" the first entry
 * of "values" is shown as selected.
 */
enyo.kind({
	name: "Inspector.Config.Select",
	kind: "Inspector.Config.IF",
	handlers: {
		onChange: "handleChange"
	},
	// events and published are defined by the base kind
	// values: Must be defined in the configuration
	components: [
		{classes: "inspector-field-caption", name: "title"}
	],
	create: function() {
		this.inherited(arguments);
		this.createComponent({name: "selector", kind: "Inspector.Internal.Select",
							fieldValue: this.fieldValue, values: this.values}, {owner: this});
		this.$.selector.setDisabled(this.getDisabled());
	},
	disabledChanged: function() {
		var selector = this.$.selector;
		if (selector) {
			selector.setDisabled(this.getDisabled());
		}
	},
	fieldValueChanged: function() {
		var selector = this.$.selector;
		if (selector) {
			selector.setFieldValue(this.getFieldValue());
		}
	},
	handleChange: function(inSender, inEvent) {
		this.fieldValue = this.$.selector.getFieldValue();
		// Decorate event with _target_
		inEvent.target = this;
	}
});

enyo.kind({
	name: "Inspector.Config.Size",
	kind: "Inspector.Config.IF",
	// events and published are defined by the base kind
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "enyo.Input", classes: "inspector-size-editor", name: "value", onchange: "handleChange", ondblclick: "handleDblClick"},
		{name: "unit", kind: "Inspector.Config.Select", classes: "css-editor-select-box", values: ["px","cm","em","ern","rem", "%"], onChange: "unitChanged"},
		{name: "slider", kind: "onyx.Slider", value: 0, style:"width:90%", onChanging:"sliderChanged", onChange:"sliderChanged"}
	],
	
	//* @public
	
	//* Facade for _enyo.Input.focus()_
	focus: function() {
		this.$.value.focus();
	},
	
	//* @protected
	
	//* Stop extraneous activate event from being fired when box is initially checked
	handleChange: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doChange({target: this});
		return true;
	},
	handleDblClick: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doDblClick({target: this});
		return true;
	},
	unitChanged: function(inSender, inEvent) {
		this.setFieldValue(this.size + inEvent.content);
		this.doChange({target: this});
	},
	sliderChanged: function(inSender, inEvent) {
		this.fieldValue = Math.round(inSender.getValue()) + this.unit;
		this.doChange({target: this});
	},
	fieldValueChanged: function() {
		var result = this.fieldValue.match(/(\d*)([%]|\w*)/);
		// this.log(">>" + this.fieldValue + "<< ", result);
		this.unit = result[2] || "px";
		this.$.unit.setFieldValue(this.unit);
		this.size = result[1] || 0;
		this.$.slider.setValue(this.size);
        this.$.slider.setProgress(this.size);
		this.$.value.setValue(this.fieldValue);
	}
});

enyo.kind({
	name: "Inspector.Config.Color",
	kind: "Inspector.Config.IF",
	// events and published are defined by the base kind
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "enyo.Input", classes: "inspector-field-editor", name: "value", onchange: "handleChange", ondblclick: "handleDblClick"},
		{name: "color", classes: "inspector-color-button"}
	],
	
	//* @public
	
	//* Facade for _enyo.Input.focus()_
	focus: function() {
		this.$.value.focus();
	},
	
	//* @protected
	
	//* Stop extraneous activate event from being fired when box is initially checked
	handleChange: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doChange({target: this});
		return true;
	},
	handleDblClick: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doDblClick({target: this});
		return true;
	},
	fieldValueChanged: function() {
		this.$.value.setValue(this.fieldValue);
		this.$.color.applyStyle("background-color", this.fieldValue);
	}
});

/**
 *
 */
enyo.kind({												// TODO: TBR
	name: "Inspector.Config.MultiType",
	kind: "Inspector.Config.IF",
	// events and published are defined by the base kind
	components: [
		{name: "title", classes: "inspector-field-caption"},
		{name: "text", kind: "enyo.Input", classes: "css-editor-field-editor", name: "value", onchange: "handleChange", 
										ondblclick: "handleDblClick"},
		{name: "colorUnit", content: "color or #value", style: "display:inline;"},
		{name: "unit", kind: "Inspector.Config.Select", classes: "css-editor-select-box", values: ["px","cm","em","ern","rem", "%"], onChange: "unitChanged"},
		{name: "aspect", kind: "Inspector.Config.Select",  classes: "css-editor-select-box", values: ["dotted", "dashed", "double", "groove", "hidden",
                                                        "ridge",  "solid", "inset", "outset"], onChange: "pickerChanged"},
		{name: "family", kind: "Inspector.Config.Select", classes: "css-editor-select-box", values: ["arial", "arial black", "comic sans ms", "courier new", "georgia", 
							"helvetica",  "times new roman", "trebuchet ms", "verdana" ], onChange: "pickerChanged"},
		{name: "slider", kind: "onyx.Slider", value: 0, style:"width:90%", onChanging:"sliderChanged", 
										onChange:"sliderChanged"},
	],
   //* Stop extraneous activate event from being fired when box is initially checked
    handleChange: function(inSender, inEvent) {
            this.fieldValue = this.$.value.getValue();
            this.doChange({target: this});
            return true;
    },
    handleDblClick: function(inSender, inEvent) {
            this.fieldValue = this.$.value.getValue();
            this.doDblClick({target: this});
            return true;
    },
	unitChanged: function(inSender, inEvent) {
		this.fieldValue = inSender.getValue();
		this.$.value.setValue();
		this.doChange({target: this});
		return true;
	},
	pickerChanged: function(inSender, inEvent) {
		this.fieldValue = inSender.getValue();
		this.$.value.setValue();
		this.doChange({target: this});
		return true;
	},
	sliderChanged: function(inSender, inEvent) {
		this.fieldValue = Math.round(inSender.getValue()) + "px";
		this.doChange({target: this});
		return true;
	},
	colorChanged: function(inSender, inEvent) {
		this.fieldValue = inEvent.color;
		this.doChange({target: this});
		return true;
	},
	setConfig: function(inConfigProperties, inItem) {
		var keys = Object.keys(inConfigProperties.config);
		var oneP = false;
		enyo.forEach(keys, function(o) {
			// build the correct styleItem object
			if (inConfigProperties.config[o] !== true) {
				if (o !== "palette") {
					inItem.$[o].destroy();					
				}
				var needed = (inConfigProperties.name === "background-color") || (inConfigProperties.name === "border-color");
				if (needed  && !oneP) {
					inItem.createComponent({name: "palette", kind: "ColorPicker", onColorSelected: "colorChanged"});
					oneP = true;
				}
			}			
		}, this);	
	},
	setValues: function(inConfigProperties, inUserProperties, inItem) {
		if (inUserProperties !== "" || inUserProperties !== null) {
			var p = inUserProperties.split(";");
			var keys = Object.keys(p);
			enyo.forEach(keys, function(obj) {
				if (p[obj].indexOf(inConfigProperties.name) > -1) {
					var s = p[obj].split(":");
					for (i=0; i < s.length; i++) {
						var val = s[i].match(/\d+\.?\d*/g);
						if (!this.done && val) {
							var unit = s[i].replace(val, "");
							this.done = true;
						}
						var k = Object.keys(inConfigProperties.config);
						enyo.forEach(k, function(o) {
							if (inConfigProperties.config[o] === true) {
								switch(o) {
								case 'aspect':
									// TODO will be implemented in JIRA-2560
									break;
								case 'colorUnit':
									// nothing to do
									break;
								case 'family':
									// TODO will be implemented in JIRA-2560
									break;
								case 'palette':
									// Nothing to do
									break;
								case 'slider':
                                    inItem.$[o].setValue(val);
                                    inItem.$[o].setProgress(val);
									break;
								case 'text':
									inItem.setFieldValue(s[i]);
									break;
								case 'unit':
									if(!inItem.$[o].$.value.getSelected() && this.done) {
										inItem.$[o].$.value.setSelected(inItem.$[o].values.indexOf(unit));
									}
									break;
								default:
									enyo.warn("cssEditor has unknown config property: ", o);
									break;
								}
							}			
						}, this);

					}
				}
			}, this);	
		}
	},
	
});
