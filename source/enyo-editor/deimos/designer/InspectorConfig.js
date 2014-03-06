/*global enyo, ilibDeimos */

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
		{kind: "onyx.InputDecorator", classes: "inspector-enyo-input-like", components: [
			{kind: "onyx.Input", classes: "inspector-field-editor", name: "value", onchange: "handleChange", ondblclick: "handleDblClick"}
		]}
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

	// TODO: YDM the style above in MenuDecorator should be replaced by a CSS class - Potential issue between less and css files

	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "onyx.MenuDecorator", style: "display: inline-block", onSelect: "itemSelected", components: [
			{kind: "onyx.InputDecorator", classes: "inspector-enyo-input-like", components: [
				{kind: "onyx.Input", classes: "inspector-field-editor", name: "value", onchange: "handleChange", ondblclick: "handleDblClick"}
			]},
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
		{name: "decorator", kind: "onyx.PickerDecorator", classes: "css-editor-picker-decorator"}
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
		{kind: "onyx.InputDecorator", classes: "inspector-enyo-input-like", components: [
			{kind: "onyx.Input", classes: "inspector-field-editor", name: "value", onchange: "handleChange", ondblclick: "handleDblClick"}
		]},
		{name: "unit", kind: "Inspector.Internal.Select", classes: "css-editor-select-box", values: ["px","cm","em","ern","rem", "%"], onChange: "unitChanged"},
		{name: "slider", kind: "onyx.Slider", value: 0, style:"width:91%", onChanging:"sliderChanged", onChange:"sliderChanged"}
	],

	//* @public

	//* Facade for _enyo.Input.focus()_
	focus: function() {
		this.$.value.focus();
	},

	//* @protected

	//* Stop extraneous activate event from being fired when box is initially checked
	handleChange: function(inSender, inEvent) {
		var result = this.parseFieldValue(this.$.value.getValue());
		var unit = this.unit;
		var size = "";
		if(result){
			unit = result[2] || this.unit;
			size = result[1] || "";
		}
		if(size){
			this.fieldValue = size + unit;
		} else{
			this.fieldValue = "";
		}
		this.doChange({target: this});
		return true;
	},
	handleDblClick: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doDblClick({target: this});
		return true;
	},
	unitChanged: function(inSender, inEvent) {
		if (this.size === "") {
			this.$.unit.setFieldValue(this.unit);
		} else {
			this.setFieldValue(this.size + inEvent.content);
			this.doChange({target: this});
		}
	},
	sliderChanged: function(inSender, inEvent) {
		this.fieldValue = Math.round(inSender.getValue()) + this.unit;
		this.doChange({target: this});
	},
	fieldValueChanged: function() {
		var result = this.parseFieldValue(this.fieldValue);
		this.unit = (result) ? result[2] : "px";
		this.size = (result) ? result[1] : "";
		this.$.unit.setFieldValue(this.unit);
		this.$.slider.setValue(this.size);
        this.$.slider.setProgress(this.size);
		if(this.size){
			this.setFieldValue(this.size + this.unit);
		}
		this.$.value.setValue(this.fieldValue);
	},
	parseFieldValue: function(fieldValue){
		return fieldValue.match(/^(\d+)([%a-zA-Z]*)$/);
	}
});

enyo.kind({
	name: "Inspector.Config.Color",
	kind: "Inspector.Config.IF",
	// events and published are defined by the base kind
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "onyx.InputDecorator", classes: "inspector-enyo-input-like", components: [
			{kind: "onyx.Input", classes: "inspector-field-editor", name: "value", onchange: "handleChange", onclick: "handleDblClick", ondblclick: "handleDblClick"}
		]},
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
		if (!this.$.palette) {
			this.createComponent({name: "palette", kind: "PalettePicker", onChange: "colorChanged"}).render();
		} else {
			this.$.palette.destroy();
		}
		return true;
	},
	fieldValueChanged: function() {
		this.$.value.setValue(this.fieldValue);
		this.$.color.applyStyle("background-color", this.fieldValue);
	},
	colorChanged: function(inSender, inEvent) {
		this.fieldValue = inEvent.originator.$.colorPicker.color;
		this.doChange({target: this});
		if (this.$.palette) {
			this.$.palette.destroy();
		}
		return true;
	},
});

enyo.kind({
	name: "Inspector.Config.PathInputRow",
	kind: "Inspector.Config.IF",
	published: {
		value: "",
		inputTip: "",
		activated: true,
		status: false,
		buttonTip: ilibDeimos("Select file...")
	},
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	handlers: {
		onFileChooserAction: "pathInputTap",
		onInputChanged: "handleChange"
	},
	components: [
		{tag: "label", classes: "inspector-field-caption", name: "title"},
		{name: "fileChooserInput", kind: "Ares.FileChooserInput", inputDisabled: true, inputClasses: "enyo-input inspector-field-editor", decoratorClasses: "inspector-enyo-input-like" }
	],
	debug: false,

	create: function () {
		this.inherited(arguments);
		this.buttonTipChanged();
		this.statusChanged();
	},
	handleChange: function () {
		this.$.fileChooserInput.setActivePathInputButton(true);
		this.fieldValue = this.$.fileChooserInput.getPathValue();
		this.doChange({target: this});
		return true;
	},
	/** @private */
	inputTipChanged: function () {
		this.$.fileChooserInput.setInputTip(this.inputTip);
	},
	disabledChanged: function() {
		var disabled = this.getDisabled();
		this.$.fileChooserInput.setInputDisabled(disabled);
		this.$.fileChooserInput.setActivePathInputButton(!disabled);
		if(!disabled && this.fieldValue){
			this.statusChanged();
			this.$.fileChooserInput.statusChanged();
		}
	},
	disableFileChooser: function(disabled){
		this.$.fileChooserInput.setActivePathInputButton(!disabled);
	},
	/** @private */
	statusChanged: function () {
		this.$.fileChooserInput.setStatus(this.status);
	},
	/** @private */
	buttonTipChanged: function () {
		this.$.fileChooserInput.setButtonTip(this.buttonTip);
	},
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		this.doInputButtonTap({header: ilibDeimos("Select file...")});
		return true;
	},
	fieldValueChanged: function() {
		this.setStatus(true);
		this.$.fileChooserInput.setPathValue(this.fieldValue);
	}
});
