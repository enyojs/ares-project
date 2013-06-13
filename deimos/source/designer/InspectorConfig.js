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
	// events and published are defined by the base kind
	// values: Must be defined in the configuration
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "Select", classes: "inspector-field-editor", name: "value", onchange: "handleChange", components: [
			// Will be filled at create() time
		]}
	],
	create: function() {
		this.values = [""].concat(this.values);		// Add a "empty value"
		this.inherited(arguments);
	},
	handleChange: function(inSender, inEvent) {
		if (this.disabled) {
			this.fieldValueChanged();	// Re-set the same previous value
		} else {
			this.fieldValue = this.$.value.getValue();
			this.doChange({target: this});
		}
		return true;
	},
	fieldValueChanged: function() {
		enyo.forEach(this.values, function(value) {
			this.$.value.createComponent({content: value, value: value});
		}, this);
		this.$.value.setSelected(Math.max(0, this.values.indexOf(this.fieldValue)));
	},
	disabledChanged: function() {
		// Nothing to do as this is not possible to disable a "Select"
	}
});

/**
 *
 */
enyo.kind({
	name: "Inspector.Config.MultiType",
	kind: "Inspector.Config.IF",
	// events and published are defined by the base kind
	components: [
		{name: "title", classes: "inspector-field-caption"},
		{name: "text", kind: "enyo.Input", classes: "css-editor-field-editor", name: "value", onchange: "handleChange", 
										ondblclick: "handleDblClick"},
		{name: "unit", kind: "Select", classes: "css-editor-select", components: [
				{content: "px", active: true},
				{content: " "},
				{content: "cm"},
				{content: "em"},
				{content: "ern"},
				{content: "%"}
		]},
		{name: "picker", kind: "Select", classes: "css-editor-select", onchange: "pickerChanged"},
		{name: "slider", kind: "onyx.Slider", value: 0, style:"width:90%", onChanging:"sliderChanged", 
										onChange:"sliderChanged"},
		{name: "palette", kind: "PalettePicker", onChange: "colorChanged"}
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
	pickerChanged: function(inSender, inEvent) {
		this.fieldValue = inSender.getValue();
		this.doChange({target: this});
		return true;
	},
	sliderChanged: function(inSender, inEvent) {
		this.fieldValue = Math.round(inSender.getValue()) + "px";
		this.doChange({target: this});
		return true;
	},
	colorChanged: function(inSender, inEvent) {
		this.fieldValue = inEvent.originator.$.colorPicker.color;
		this.doChange({target: this});
		return true;
	}
});
