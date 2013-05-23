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
		{classes: "inspector-field-caption", name: "title"},
		{name: "decorator", kind: "onyx.PickerDecorator"}
	],
	initComponents: function() {
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
	},
	disabledChanged: function() {
		this.$.pickerButton.setDisabled(this.getDisabled());
	},
	fieldValueChanged: function() {
	},
	handleChange: function(inSender, inEvent) {
		this.initialChange = this.initialChange || false;

		if (!this.initialChange) {
			this.initialChange = true;
			return true;
		}
		
		this.setFieldValue(this.$.value.getSelected().value);
		
		// Decorate event with _target_
		inEvent.target = this;
	},
	updateSelected: function() {
		var selectedIndex = Math.max(0, this.values.indexOf(this.fieldValue));
		var selected = this.$.value.getClientControls()[selectedIndex];
		this.$.value.setSelected(selected);
	}
});
