/**
 * This Kind define a row containing a checkbox widget
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.CheckBoxRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		label: "",
		name: "",
		activated: false, 
		config: {}, 
		defaultValue: ""
	},
	components: [
		{
			kind: "onyx.Checkbox", name: "ConfigurationCheckBox", 
			classes: "ares-project-properties-drawer-row-check-box-label",
			onchange: "updateConfigurationValue"
		},
		{name: "labelValue", content: this.label, }
	],
	create: function () {
		this.inherited(arguments);
		this.labelChanged();
	},
	labelChanged: function () {
		this.$.labelValue.setContent(this.name);
	},
	updateConfigurationValue: function (inSender, inValue) {		
		var saveProperty = (function(inConfig) {
			this.log("Saving operation ... Originator: ", this.name , " Value: ",inSender.getValue());
			inConfig.features[this.name] = inSender.getValue();			
		}).bind(this);		

		this.bubble("onEditConfig", saveProperty);


	}
});

/**
 * Define a row containing an Input widget.
 * This kind in meant to be used to define a configuration's parameter that goes to the block
 * {providers.preferences} of the file "project.json"
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.InputRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		label: "",
		name: "",
		value: "",
		defaultValue: ""
	},
	components: [
		{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium", 
			components: [{
					kind: "onyx.Input",
					name: "ConfigurationInput", 
					onchange: "updateConfigurationValue"
				}
			]
		}

	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		this.$.ConfigurationInput.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty = (function(inConfig) {
			this.log("Saving operation ... Originator: ", this.name , " Value: ",inSender.value);
			inConfig.preferences[this.name] = inSender.value;			
		}).bind(this);		

		this.bubble("onEditConfig", saveProperty);
	}
});

/**
 * This Kind define a row containing a Picker widget and attached to a drawer in {Phonegap.ProjectProperties}
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.PickerRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {

		label: "",
		name: "",
		value: "", 
		defaultValue: "" 
	},
	components: [
		{name: "label",	classes: "ares-project-properties-drawer-row-label"},
		{
			kind: "onyx.PickerDecorator",

			components: [
				{kind: "onyx.PickerButton", classes: "ares-project-properties-picker"},
				{kind: "onyx.Picker", name: "ConfigurationPicker", onSelect: "updateConfigurationValue"}
			]
		}
	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},	 

	valueChanged: function () {
		enyo.forEach(this.value, function (inValue) {			
			if (inValue === this.defaultValue) {
				this.$.ConfigurationPicker.createComponent({content: inValue, active: true});
			} else {
				this.$.ConfigurationPicker.createComponent({content: inValue});
			}
			
		}, this);
	}, 

	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty = (function(inConfig) {
			this.log("Saving operation ... Originator: ", this.name , " Value: ", inValue.content);
			inConfig.preferences[this.name] = inValue.content;			
		}).bind(this);		
		
		this.bubble("onEditConfig", saveProperty);
	}	
});

enyo.kind({
	name: "Phonegap.ProjectProperties.AndroidImgRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {	
		label: "",	
		name: "",	
		value: "",
		density: "", 
		defaultValue: ""
	},
	components: [{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		}, 
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium", 
			components: [
				{kind: "onyx.Input", name: "AndroidImgPath", onchange: "updateConfigurationValue"}
			]
		}, 
		{
			kind: "onyx.PickerDecorator",
			components: [
				{kind: "onyx.PickerButton"},
				{
					kind: "onyx.Picker", 
					name: "AndroidDensity", 
					onSelect: "updateAndroidIconDensity",
					components: [
						{content: "ldpi"},
						{content: "mdpi", active: true}, 
						{content: "hdpi"},
						{content: "xdpi"}
					]
				}
			]
		}

	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		this.$.AndroidImgPath.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.icons["android"].src = inSender.value;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.splashes["android"].src = inSender.value;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}, 

	updateAndroidIconDensity: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inValue.content);
					inConfig.icons["android"].density = inValue.content;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inValue.content);
					inConfig.splashes["android"].density = inValue.content;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});






enyo.kind({
	name: "Phonegap.ProjectProperties.IosImgRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {		
		label: "",
		name: "",
		value: "", 
		defaultValue: ""
	},	
	components: [
		{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		}, 
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium", 
			components: [{
					kind: "onyx.Input",
					name: "IosImgPath", 
					onchange: "updateConfigurationValue"

				}
			]
		},
		{content: "Lenght"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-small",
			components: [{
					kind: "onyx.Input",
					name: "IosImgHeight", 
					onchange: "updateIosIconHeightValue"
				}
			]
		},
		{content: "width"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-small",
			components: [{
					kind: "onyx.Input",
					name: "IosImgWidth", 
					onchange: "updateIosIconWidhtValue"
				}
			]
		}
	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		var input = this.$.IosIconInput;
		input.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.icons["ios"].src = inSender.value;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.splashes["ios"].src = inSender.value;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	},

	updateIosIconHeightValue: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.icons["ios"].height = inSender.value;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.splashes["ios"].height = inSender.value;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}, 

	updateIosIconWidhtValue: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.icons["ios"].width = inSender.value;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.splashes["ios"].width = inSender.value;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});







enyo.kind({
	name: "Phonegap.ProjectProperties.GeneralImgRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {		
		label: "",
		name: "",
		value: "", 
		defaultValue: ""
	},
	components: [
		{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		}, 
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium", 
			components: [{
					kind: "onyx.Input",
					name: "GeneralImgPath", 
					onchange: "updateConfigurationValue"
				}
			]
		},


	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.icons["general"].src = inSender.value;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.splashes["general"].src = inSender.value;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.WinphoneImgRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		
		label: "",
		name: "",
		value: "", 
		defaultValue: ""
	},
	components: [
		{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		}, 
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium", 
			components: [{
					kind: "onyx.Input",
					name: "WinphoneImgPath", 
					onchange: "updateConfigurationValue"
				}
			]
		},


	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.icons["winphone"].src = inSender.value;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.splashes["winphone"].src = inSender.value;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});


enyo.kind({
	name: "Phonegap.ProjectProperties.BlackBerryImgRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {		
		label: "",
		name: "",
		value: "", 
		defaultValue: ""
	},
	handlers: {
			onConfigClone: "updateConfig"
	},
	components: [
		{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		}, 
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium", 
			components: [{
					kind: "onyx.Input",
					name: "BlackBerryImgPath", 
					onchange: "updateConfigurationValue"
				}
			]
		},


	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.icons["blackberry"].src = inSender.value;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.splashes["blackberry"].src = inSender.value;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
			
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.WebOsImgRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {		
		label: "",
		name: "",
		value: "", 
		defaultValue: ""
	},
	handlers: {
			onConfigClone: "updateConfig"
	},
	components: [
		{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		}, 
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium", 
			components: [{
					kind: "onyx.Input",
					name: "WebOsImgPath", 
					onchange: "updateConfigurationValue"
				}
			]
		},
	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		if (this.name === "icon"){
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.icons["webos"].src = inSender.value;			
				}).bind(this);	
		} else {
			var saveProperty = (function(inConfig) {
					this.log("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
					inConfig.splashes["webos"].src = inSender.value;			
				}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});