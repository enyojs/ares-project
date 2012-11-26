enyo.kind({
	name: "Inspector.Config.Boolean",
	events : {
		onChange: ""
	},
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "enyo.Checkbox", classes: "inspector-field-checkbox", name: "value", onActivate: "handleChange"}
	],
	create: function() {
		this.inherited(arguments);
		this.log(this.fieldName + " --> " + this.fieldValue);
		this.$.title.setContent(this.fieldName);
		this.$.value.setValue(this.fieldValue);
	},
	handleChange: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getChecked();
		this.doChange({target: this});
		return true; // Stop propagation
	}
});

enyo.kind({
	name: "Inspector.Config.Text",
	events : {
		onChange: "",
		onDblClick: ""
	},
	published: {
		fieldValue: ""
	},
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "enyo.Input", classes: "inspector-field-editor", name: "value", onchange: "handleChange", ondblclick: "handleDblClick"}
	],
	create: function() {
		this.inherited(arguments);
		this.log(this.fieldName + " --> " + this.fieldValue);
		this.$.title.setContent(this.fieldName);
		this.$.value.setValue(this.fieldValue);
	},
	handleChange: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doChange({target: this});
		return true; // Stop propagation
	},
	handleDblClick: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.log(this);
		this.doDblClick({target: this});
		return true; // Stop propagation
	},
	fieldValueChanged: function() {
		this.$.value.setValue(this.fieldValue);
	}
});

enyo.kind({
	name: "Inspector.Config.InputType",
	events : {
		onChange: ""
	},
	values: ["text", "url", "email", "search", "number"],
	components: [
		{classes: "inspector-field-caption", name: "title"},
		{kind: "Select", classes: "inspector-field-editor", name: "value", onchange: "handleChange", components: [
			// Will be filled at create() time
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.log(this.fieldName + " --> " + this.fieldValue);
		this.$.title.setContent(this.fieldName);
		enyo.forEach(this.values, function(value) {
			this.$.value.createComponent({content: value, value: value});
		}, this);
		this.$.value.setSelected(Math.max(0, this.values.indexOf(this.fieldValue)));
	},
	handleChange: function(inSender, inEvent) {
		this.fieldValue = this.$.value.getValue();
		this.doChange({target: this});
		return true; // Stop propagation
	}
});