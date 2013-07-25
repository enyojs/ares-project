/* global ares */

/**
 * Kind that define a generic row widget
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.Row",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		label: "",
		name: "",
		defaultValue: ""
	},
	components: [				
	],
	
	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);			
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.CheckBoxRow",
	kind: "Phonegap.ProjectProperties.Row",	
	debug: false,
	published: {		
		activated: false	
	},
	components: [
		{	
			kind: "onyx.Checkbox", 
			name: "ConfigurationCheckBox", 
			classes: "ares-project-properties-drawer-row-check-box-label",
			onchange: "updateConfigurationValue"
		},
		{name: "label", content: this.label}	
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);	
		this.labelChanged();	
	},	

	/**
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.name);
	},

	/**
	 * @private
	 */
	defaultValueChanged: function () {	
		this.$.ConfigurationCheckBox.setChecked(this.defaultValue);		
	},

	/**
	 * Event handler that is triggered when the value of the checkbox change. It defines
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
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	published: {
		value: "",
		inputtip: "",
		activated: false,
		status: false,
		buttontip: ""
	},
	components: [
		{name: "label", classes: "ares-project-properties-drawer-row-label"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium", 
			components: [{
					kind: "onyx.Input",	
					name: "ConfigurationInput", 
					onchange: "updateConfigurationValue"
				}
			]
		},
		{kind: "onyx.IconButton", name:"configurationButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"}
	],
	
	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputtipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttontipChanged();
	},

	/**
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	defaultValueChanged: function () {
		this.$.ConfigurationInput.setValue(this.defaultValue);
	},

	/**
	 * Event handler that is triggered when the value of the input change. It defines
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
	},

	/** @private */
	valueChanged: function () {
		this.$.ConfigurationInput.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputtipChanged: function () {
		this.$.ConfigurationInput.setAttribute("title", this.inputtip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.configurationButton.show();
			this.statusChanged();
		} else {
			this.$.configurationButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.configurationButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.configurationButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttontipChanged: function () {
		this.$.configurationButton.setAttribute("title", this.buttontip);
	},
	
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'icon') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.AccessRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	components: [
		{name: "label", classes: "ares-project-properties-drawer-row-label"},
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

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},

	/**
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	defaultValueChanged: function () {
		this.$.ConfigurationInput.setValue(this.defaultValue);
	},

	/**
	 * Event handler that is triggered when the value of the input change. It defines
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
			inConfig.access.origin = inSender.value;			
		}).bind(this);		

		this.bubble("onEditConfig", saveProperty);
	}
});

/**
 * This Kind define a row containing a Picker widget and attached to a drawer in {Phonegap.ProjectProperties}
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.PickerRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		value: ""
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

	/**
	 * @private
	 */
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
	 * Set the content of the row's picker when the row is created.
	 * @ private
	 */
	valueChanged: function () {
		enyo.forEach(this.value, function (inValue) {
			var itemState = inValue === this.defaultValue ? true : false;
			this.$.ConfigurationPicker.createComponent({content: inValue, active: itemState});			
		}, this);
	}, 

	/**
	 * This function change the displayed value of the picker to the parameter "inContent".
	 * The parameter must be contained in an existing picker's item.
	 * @param  {String} inContent A String value originated from the attribut of "project.json
	 *                            "associated to the picker widget.
	 * @private
	 */
	activatePickerItemByContent: function(inContent){
		for (var key in this.$.ConfigurationPicker.$) {
		    if(this.$.ConfigurationPicker.$[key].kind === "onyx.MenuItem"){
			this.$.ConfigurationPicker.$[key].active = false;
				if(this.$.ConfigurationPicker.$[key].content === inContent){
					this.$.ConfigurationPicker.setSelected(this.$.ConfigurationPicker.$[key]);					
				}	
		    }
		  }
	},

	/**
	 * @private
	 */
	defaultValueChanged: function(){
		this.activatePickerItemByContent(this.defaultValue);
	},

	/**
	 * Event handler that is triggered when the value of the picker change. It defines
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
 * Define a row to let the user add the path to an Android icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.AndroidImgRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {				
		density: "",

		value: "",
		inputtip: "",
		activated: false,
		status: false,
		buttontip: ""	
	},
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
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
		{kind: "onyx.IconButton", name:"AndroidImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"},
		{
			kind: "onyx.PickerDecorator",
			classes: "ares-project-properties-picker-small",
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

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();	

		this.valueChanged();
		this.inputtipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttontipChanged();	
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	defaultValueChanged: function () {
		this.$.AndroidImgPath.setValue(this.defaultValue);
	},

	/**
	 * @private
	 */
	densityChanged: function () {
		this.activatePickerItemByContent(this.density);
	},

	/**
	 * @private
	 */
	activatePickerItemByContent: function(inContent){
		for (var key in this.$.AndroidDensity.controls) {
		    if(this.$.AndroidDensity.controls[key].kind === "onyx.MenuItem"){
			this.$.AndroidDensity.controls[key].active = false;
				if(this.$.AndroidDensity.controls[key].content === inContent){
					this.$.AndroidDensity.setSelected(this.$.AndroidDensity.controls[key]);					
				}	
		    }
		  }
	},

	

	/**
	 * Event handler that is triggered when the value of the input change. It defines
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';
		var saveProperty = (function(inConfig) {
			this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
			inConfig[target]["android"].src = inSender.value;
		}).bind(this);
		this.trace('updated code');

		this.bubble("onEditConfig", saveProperty);
	}, 

	/**
	 * Event handler that is triggered when the value of the picker change. It defines
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';		
		var	saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inValue.content);
				inConfig[target]["android"].density = inValue.content;			
			}).bind(this);			

		this.bubble("onEditConfig", saveProperty);
	},

	/** @private */
	valueChanged: function () {
		this.$.AndroidImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputtipChanged: function () {
		this.$.AndroidImgPath.setAttribute("title", this.inputtip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.AndroidImgButton.show();
			this.statusChanged();
		} else {
			this.$.AndroidImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.AndroidImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.AndroidImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttontipChanged: function () {
		this.$.AndroidImgButton.setAttribute("title", this.buttontip);
	},
	
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'icon') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	}
});

/**
 * Define a row to let the user add the path to an IOS icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.IosImgRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	published: {		
		height: "",
		width: "",

		value: "",
		inputtip: "",
		activated: false,
		status: false,
		buttontip: ""
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
		{kind: "onyx.IconButton", name:"IosImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"},
		{content: "Length", classes: "ares-project-properties-drawer-row-attribut-label"},
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
		{content: "Width", classes: "ares-project-properties-drawer-row-attribut-label"},
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

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputtipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttontipChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	defaultValueChanged: function () {	
		this.$.IosImgPath.setValue(this.defaultValue);
	},

	/**
	 * @private
	 */
	heightChanged: function(){
		this.$.IosImgHeight.setValue(this.height);
	},

	/**
	 * @private
	 */
	widthChanged: function(){
		this.$.IosImgWidth.setValue(this.width);
	},
	/**
	 * Event handler that is triggered when the value of the input change. It defines
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';		
		var saveProperty = (function(inConfig) {
			this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
			inConfig[target]["ios"].src = inSender.value;			
		}).bind(this);	
		

		this.bubble("onEditConfig", saveProperty);
	},

	/**
	 * Event handler that is triggered when the value of the input that hold the value of 
	 * the IOS icon height change. It defines a function and passe it as a parameter in the 
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';		
		var	saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig[target]["ios"].height = inSender.value;			
			}).bind(this);	
		
		this.bubble("onEditConfig", saveProperty);
	}, 

	/**
	 * Event handler that is triggered when the value of the input that hold the value of 
	 * the IOS icon width change. It defines a function and passe it as a parameter in the 
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';		
		var	saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig[target]["ios"].width = inSender.value;			
			}).bind(this);	
		
		this.bubble("onEditConfig", saveProperty);
	},

	/** @private */
	valueChanged: function () {
		this.$.IosImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputtipChanged: function () {
		this.$.IosImgPath.setAttribute("title", this.inputtip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.IosImgButton.show();
			this.statusChanged();
		} else {
			this.$.IosImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.IosImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.IosImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttontipChanged: function () {
		this.$.IosImgButton.setAttribute("title", this.buttontip);
	},
	
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'icon') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	}
});

/**
 * Define a row to let the user add the path to a default icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.GeneralImgRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,	
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	published: {
		value: "",
		inputtip: "",
		activated: false,
		status: false,
		buttontip: ""
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
		{kind: "onyx.IconButton", name:"GeneralImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputtipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttontipChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	defaultValueChanged: function () {
		this.$.GeneralImgPath.setValue(this.defaultValue);
	},

	/**
	 * Event handler that is triggered when the value of the input that hold the value of 
	 * the default icon change. It definesa function and passe it as a parameter in the 
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';		
		var	saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig[target]["general"].src = inSender.value;			
			}).bind(this);			

		this.bubble("onEditConfig", saveProperty);
	},

	/** @private */
	valueChanged: function () {
		this.$.GeneralImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputtipChanged: function () {
		this.$.GeneralImgPath.setAttribute("title", this.inputtip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.GeneralImgButton.show();
			this.statusChanged();
		} else {
			this.$.GeneralImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.GeneralImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.GeneralImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttontipChanged: function () {
		this.$.GeneralImgButton.setAttribute("title", this.buttontip);
	},
	
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'icon') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	}
});


/**
 * Define a row to let the user add the path to a Winphone icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.WinphoneImgRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	published: {
		value: "",
		inputtip: "",
		activated: false,
		status: false,
		buttontip: ""
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
		{kind: "onyx.IconButton", name:"WinphoneImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputtipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttontipChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	defaultValueChanged: function () {	
		this.$.WinphoneImgPath.setValue(this.defaultValue);
	},

	/**
	 * Event handler that is triggered when the value of the input that hold the value of 
	 * the Winphone icon change. It definesa function and passe it as a parameter in the 
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';			
		var	saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig[target]["winphone"].src = inSender.value;			
			}).bind(this);

		this.bubble("onEditConfig", saveProperty);
	},

	/** @private */
	valueChanged: function () {
		this.$.WinphoneImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputtipChanged: function () {
		this.$.WinphoneImgPath.setAttribute("title", this.inputtip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.WinphoneImgButton.show();
			this.statusChanged();
		} else {
			this.$.WinphoneImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.WinphoneImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.WinphoneImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttontipChanged: function () {
		this.$.WinphoneImgButton.setAttribute("title", this.buttontip);
	},
	
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'icon') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	}
});

/**
 * Define a row to let the user add the path to a BlackBerry icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.BlackBerryImgRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	published: {
		value: "",
		inputtip: "",
		activated: false,
		status: false,
		buttontip: ""
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
		{kind: "onyx.IconButton", name:"BlackBerryImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputtipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttontipChanged();
	},
	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},
	
	/**
	 * @private
	 */
	defaultValueChanged: function () {	
		this.$.BlackBerryImgPath.setValue(this.defaultValue);
	},

	/**
	 * Event handler that is triggered when the value of the input that hold the value of 
	 * the BlackBerry icon change. It definesa function and passe it as a parameter in the 
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';		
		var	saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig[target]["blackberry"].src = inSender.value;			
			}).bind(this);		

		this.bubble("onEditConfig", saveProperty);
			
	},

	/** @private */
	valueChanged: function () {
		this.$.BlackBerryImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputtipChanged: function () {
		this.$.BlackBerryImgPath.setAttribute("title", this.inputtip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.BlackBerryImgButton.show();
			this.statusChanged();
		} else {
			this.$.BlackBerryImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.BlackBerryImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.BlackBerryImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttontipChanged: function () {
		this.$.BlackBerryImgButton.setAttribute("title", this.buttontip);
	},
	
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'icon') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	}
});

/**
 * Define a row to let the user add the path to a Webos icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.WebOsImgRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	published: {
		value: "",
		inputtip: "",
		activated: false,
		status: false,
		buttontip: ""
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
		{kind: "onyx.IconButton", name:"WebOsImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputtipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttontipChanged();
	},
	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},	

	/**
	 * @private
	 */
	defaultValueChanged: function () {	
		this.$.WebOsImgPath.setValue(this.defaultValue);
	},

	/**
	 * Event handler that is triggered when the value of the input that hold the value of 
	 * the Webos icon change. It definesa function and passe it as a parameter in the 
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
		var target = this.name === "icon" ? 'icon' : 'splashScreen';			
		var	saveProperty = (function(inConfig) {
				this.trace("Saving operation ... Originator: ", this.name , " Value: ", inSender.value);
				inConfig[target]["webos"].src = inSender.value;			
			}).bind(this);			
		this.bubble("onEditConfig", saveProperty);
	},

	/** @private */
	valueChanged: function () {
		this.$.WebOsImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputtipChanged: function () {
		this.$.WebOsImgPath.setAttribute("title", this.inputtip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.WebOsImgButton.show();
			this.statusChanged();
		} else {
			this.$.WebOsImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.WebOsImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.WebOsImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttontipChanged: function () {
		this.$.WebOsImgButton.setAttribute("title", this.buttontip);
	},
	
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'icon') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	}
});
