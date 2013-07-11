/* global ares */


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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.labelValue.setContent(this.name);
	},

	/**
	 * Event handler that is trigred when the value of the checkbox change. It define 
	 * a function and passe it as a parameter in the bubbling action to let the 
	 * function "saveConfig()" in the kind {Phonegap.ProjectProperties} save the new value 
	 * in the file "project.json"
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {		
		var saveProperty = (function(inConfig) {
			this.trace("Saving operation ... Originator: ", this.name , " Value: ",inSender.getValue());
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * Set the content of the row's value when the row is created
	 * @ private
	 */
	valueChanged: function () {
		this.$.ConfigurationInput.setValue(this.value);
	},
	/**
	 * Event handler that is trigred when the value of the input change. It define 
	 * a function and passe it as a parameter in the bubbling action to let the 
	 * function "saveConfig()" in the kind {Phonegap.ProjectProperties} save the new value 
	 * in the file "project.json"
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty = (function(inConfig) {
			this.trace("Saving operation ... Originator: ", this.name , " Value: ",inSender.value);
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},	 

	/**
	 * Set the content of the row's value when the row is created
	 * @ private
	 */
	valueChanged: function () {
		enyo.forEach(this.value, function (inValue) {			
			if (inValue === this.defaultValue) {
				this.$.ConfigurationPicker.createComponent({content: inValue, active: true});
			} else {
				this.$.ConfigurationPicker.createComponent({content: inValue});
			}
			
		}, this);
	}, 

	/**
	 * Event handler that is trigred when the value of the picker change. It define 
	 * a function and passe it as a parameter in the bubbling action to let the 
	 * function "saveConfig()" in the kind {Phonegap.ProjectProperties} save the new value 
	 * in the file "project.json"
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty = (function(inConfig) {
			this.trace("Saving operation ... Originator: ", this.name , " Value: ", inValue.content);
			inConfig.preferences[this.name] = inValue.content;			
		}).bind(this);		
		
		this.bubble("onEditConfig", saveProperty);
	}	
});

/**
 * Defin a row to let the user add the path to an Android icon or a splash screen image into the file "config.xml".
 */
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * Set the content of the row's value when the row is created
	 * @ private
	 */
	valueChanged: function () {
		this.$.AndroidImgPath.setValue(this.value);
	},

	/**
	 * Event handler that is trigred when the value of the input change. It define 
	 * a function and passe it as a parameter in the bubbling action to let the 
	 * function "saveConfig()" in the kind {Phonegap.ProjectProperties} save the new value 
	 * in the file "project.json". This function is used on an Android Icon as well as for 
	 * an Android splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty;
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.icons["android"].src = inSender.value;			
				}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.splashes["android"].src = inSender.value;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}, 

	/**
	 * Event handler that is trigred when the value of the picker change. It define 
	 * a function and passe it as a parameter in the bubbling action to let the 
	 * function "saveConfig()" in the kind {Phonegap.ProjectProperties} save the new value 
	 * in the file "project.json". This function is used on an Android Icon as well as for 
	 * an Android splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateAndroidIconDensity: function (inSender, inValue) {
		var saveProperty;
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inValue.content);
				inConfig.icons["android"].density = inValue.content;			
			}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inValue.content);
				inConfig.splashes["android"].density = inValue.content;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});

/**
 * Defin a row to let the user add the path to an IOS icon or a splash screen image into the file "config.xml".
 */
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * Set the content of the row's value when the row is created
	 * @ private
	 */
	valueChanged: function () {
		this.$.IosIconInput.setValue(this.value);
	},
	/**
	 * Event handler that is trigred when the value of the input change. It define 
	 * a function and passe it as a parameter in the bubbling action to let the 
	 * function "saveConfig()" in the kind {Phonegap.ProjectProperties} save the new value 
	 * in the file "project.json". This function is used on an IOS Icon as well as for 
	 * an IOS splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty;
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.icons["ios"].src = inSender.value;			
			}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.splashes["ios"].src = inSender.value;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	},

	/**
	 * Event handler that is trigred when the value of the input that hold the value of 
	 * the IOS icon height change. It define a function and passe it as a parameter in the 
	 * bubbling action to let the function "saveConfig()" in the kind {Phonegap.ProjectProperties} 
	 * save the new value in the file "project.json". This function is used on an Android Icon as
	 * well as for an Android splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateIosIconHeightValue: function (inSender, inValue) {
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.icons["ios"].height = inSender.value;			
			}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.splashes["ios"].height = inSender.value;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}, 

	/**
	 * Event handler that is trigred when the value of the input that hold the value of 
	 * the IOS icon width change. It define a function and passe it as a parameter in the 
	 * bubbling action to let the function "saveConfig()" in the kind {Phonegap.ProjectProperties} 
	 * save the new value in the file "project.json". This function is used on an Android Icon as
	 * well as for an Android splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateIosIconWidhtValue: function (inSender, inValue) {
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.icons["ios"].width = inSender.value;			
			}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.splashes["ios"].width = inSender.value;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});






/**
 * Defin a row to let the user add the path to a default icon or a splash screen image into the file "config.xml".
 */
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * Set the content of the row's value when the row is created
	 * @ private
	 */
	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
	},

	/**
	 * Event handler that is trigred when the value of the input that hold the value of 
	 * the default icon change. It define a function and passe it as a parameter in the 
	 * bubbling action to let the function "saveConfig()" in the kind {Phonegap.ProjectProperties} 
	 * save the new value in the file "project.json". This function is used on an Android Icon as
	 * well as for an Android splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty;
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.icons["general"].src = inSender.value;			
			}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.splashes["general"].src = inSender.value;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});


/**
 * Define a row to let the user add the path to a Winphone icon or a splash screen image into the file "config.xml".
 */
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * Set the content of the row's value when the row is created
	 * @ private
	 */
	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
	},
	/**
	 * Event handler that is trigred when the value of the input that hold the value of 
	 * the Winphone icon change. It define a function and passe it as a parameter in the 
	 * bubbling action to let the function "saveConfig()" in the kind {Phonegap.ProjectProperties} 
	 * save the new value in the file "project.json". This function is used on an Android Icon as
	 * well as for an Android splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty;
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.icons["winphone"].src = inSender.value;			
			}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.splashes["winphone"].src = inSender.value;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});

/**
 * Defin a row to let the user add the path to a BlackBerry icon or a splash screen image into the file "config.xml".
 */
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},
	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},
	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
	},

	/**
	 * Event handler that is trigred when the value of the input that hold the value of 
	 * the BlackBerry icon change. It define a function and passe it as a parameter in the 
	 * bubbling action to let the function "saveConfig()" in the kind {Phonegap.ProjectProperties} 
	 * save the new value in the file "project.json". This function is used on an Android Icon as
	 * well as for an Android splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty;
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.icons["blackberry"].src = inSender.value;			
			}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.splashes["blackberry"].src = inSender.value;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
			
	}
});

/**
 * Defin a row to let the user add the path to a Webos icon or a splash screen image into the file "config.xml".
 */
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},
	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
	},

	/**
	 * Event handler that is trigred when the value of the input that hold the value of 
	 * the Webos icon change. It define a function and passe it as a parameter in the 
	 * bubbling action to let the function "saveConfig()" in the kind {Phonegap.ProjectProperties} 
	 * save the new value in the file "project.json". This function is used on an Android Icon as
	 * well as for an Android splash screen.
	 * 
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		var saveProperty;
		if (this.name === "icon"){
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.icons["webos"].src = inSender.value;			
			}).bind(this);	
		} else {
			saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig.splashes["webos"].src = inSender.value;			
			}).bind(this);	
		}

		this.bubble("onEditConfig", saveProperty);
	}
});