/* jshint indent: false */ // TODO: ENYO-3311
/* global ares, Phonegap */

/**
 * Kind that define a generic row widget
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.Row",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		label: undefined,
		name: undefined,
		value: undefined,
		jsonSection: undefined,
		platform: undefined,
		description: undefined,
		err: null
	},
	events: {
		onEnableOkButton: "",
		onDisableOkButton: ""
	},
	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.errChanged();
	},

	errChanged: function(prevErr) {
		this.trace("err:", this.err && this.err.toString(), "<-", prevErr && prevErr.toString());
		if (prevErr && !this.err) {
			this.doEnableOkButton();
		} else if (!prevErr && this.err) {
			this.warn(this.err);
			this.doDisableOkButton({reason: this.err.toString()});
		}
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
			name: "configurationCheckBox",
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
	valueChanged: function () {
		this.$.configurationCheckBox.setChecked(this.value);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inSender.getValue());

		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.jsonSection][this.name]);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.name] = this.getValue();
	}
});

/**
 * Define a row containing an Input widget.
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
		inputTip: ""
	},
	components: [
		{name: "label", classes: "ares-project-properties-drawer-row-label"},
			{
			kind: "FittableRows",
			components: [
				{
					kind: "onyx.InputDecorator",
					classes: "ares-project-properties-input-medium",
					components: [
						{
							kind: "onyx.Input",
							name: "configurationInput",
							onchange: "updateConfigurationValue"							
						}
					]
				}, 

				{name: "errorMsg", content: "The value must be a number", showing: false, classes: "ares-project-properties-input-error-message"}
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
		
		this.$.configurationInput.setAttribute("placeholder", this.description);
		this.valueChanged();
		this.inputTipChanged();
	},

	/**
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/** @private */
	valueChanged: function () {
		this.$.configurationInput.setValue(this.value);
	},

	/** @private */
	inputTipChanged: function () {
		this.$.configurationInput.setAttribute("title", this.inputTip);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inSender.getValue());
		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.jsonSection][this.name]);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.name] = this.getValue();
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.NumberInputRow",
	kind: "Phonegap.ProjectProperties.InputRow",

	updateConfigurationValue: function (inSender, inValue) {
		if(!isNaN(inSender.getValue())) {
			this.$.errorMsg.hide();
			this.setValue(inSender.getValue());
			this.setErr(null);
		} else {
			var err = new Error(this.$.label.getContent().toString() + ": '" + inSender.getValue().toString() + "' is not a number");
			this.$.errorMsg.setContent(err.toString());
			this.$.errorMsg.show();
			this.setErr(err);
		}
		
		return true;
	}

});

enyo.kind({
	name: "Phonegap.ProjectProperties.BuildOption",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	published: {
		pan: ""
	},
	debug: false,
	components: [
		{
			kind: "onyx.Checkbox",
			name: "configurationCheckBox",
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
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	valueChanged: function () {
		this.$.configurationCheckBox.setChecked(this.value);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inSender.getValue());
		this.displayConfigXmlPanel();
		return true;
	},
	displayConfigXmlPanel: function(){

		if (this.name === "autoGenerateXML"){
			this.trace("auto-generate config.xml is enabled: ", this.getValue());

			if (this.pan) {
				if(this.getValue()) {
					this.pan.show();
				} else {
					this.pan.hide();
				}
			}
		}
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]);
		this.displayConfigXmlPanel();
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name] = this.getValue();
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
					name: "configurationInput",
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
	valueChanged: function () {
		this.$.configurationInput.setValue(this.value);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inSender.getValue());
		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config.access.origin);
		this.valueChanged();
	},
	/** @public */
	getProjectConfig: function (config) {
		config.access.origin = this.getValue();
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
		contentValue: undefined
	},
	components: [
		{name: "label",	classes: "ares-project-properties-drawer-row-label"},
		{kind: "FittableRows", 
			components: [
				{
					kind: "onyx.PickerDecorator",
					components: [
						{kind: "onyx.PickerButton", name: "configurationPickerButton", classes: "ares-project-properties-picker"},
						{kind: "onyx.Picker", name: "configurationPicker", onSelect: "updateConfigurationValue"}
					]
				},
				{name: "errorMsg", content: "The value must be a number", showing: false, classes: "ares-project-properties-input-error-message"}
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
		this.contentValueChanged();
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
	contentValueChanged: function () {
		enyo.forEach(this.contentValue, function (inValue) {
			var itemState = inValue === this.value ? true : false;
			this.$.configurationPicker.createComponent({content: inValue, active: itemState});
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
		for (var key in this.$.configurationPicker.$) {
		    if(this.$.configurationPicker.$[key].kind === "onyx.MenuItem"){
			this.$.configurationPicker.$[key].active = false;
				if(this.$.configurationPicker.$[key].content === inContent){
					this.$.configurationPicker.setSelected(this.$.configurationPicker.$[key]);
				}
		    }
		}
	},

	/**
	 * @private
	 */
	valueChanged: function(){
		this.activatePickerItemByContent(this.value);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		
		if (this.checkActiveValue(inValue.content)) {
			this.showErrorMessage(inValue.content, this.name, "Not an allowed value. Select another one using the picker.");
		} else {
			this.hideErrorMessage(this.name);
			this.contentValueChanged();
			this.setValue(inValue.content);
		}

		return true;
	},
	
	/**
	 * Show an error message under the picker & disable the 'OK' button of the Pop-up.
	 * @param  {String} erroneousValue     The incorrect value spoted from the file 'project.json'
	 * @param  {String} hightLightedPicker Name of the picker row.
	 * @param  {String} errorMsg           Displayed error message
	 * @private
	 */
	showErrorMessage: function(pickerButtonValue, hightLightedPicker, errorMsg) {
		var err = new Error(this.$.label.getContent().toString() + ": '" + pickerButtonValue + "' is not an allowed value");
		this.container.$[hightLightedPicker].$.configurationPickerButton.setContent(pickerButtonValue);
		
		this.container.$[hightLightedPicker].$.errorMsg.setContent(errorMsg);
		this.container.$[hightLightedPicker].$.errorMsg.show();
		
		this.setErr(err);
	},

	/**
	 * Check if the value recovered form the file "project.json" is contained or not in the picker values list.
	 * @param  {String} inValue value to be checked.
	 * @return {boolean}         true if the value is incorrect, false otherwise.
	 * @private
	 */
	checkActiveValue: function(inValue){
		var incorrectValue = true;

		enyo.forEach(this.contentValue, function(validValue) {
			if(inValue === validValue) {
				incorrectValue = false;
			}
		}, this);

		return incorrectValue;
	},
	
	/**
	 * Hide the error message 
	 * 
	 * @param  {String} hightLightedPicker name of the row to exempted form the error message.
	 * @private
	 */
	hideErrorMessage: function(hightLightedPicker){
		this.container.$[hightLightedPicker].$.errorMsg.hide();
		this.setErr(null);
	},

	/** @public */
	setProjectConfig: function (config) {
		if (this.checkActiveValue(config[this.jsonSection][this.name])) {
			this.showErrorMessage(config[this.jsonSection][this.name], this.name, "Not an allowed value. Select another one using the picker.");
		} else {
			this.hideErrorMessage(this.name);
			this.setValue(config[this.jsonSection][this.name]);
		}	
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.name] = this.getValue();
	}
});


enyo.kind({
	name: "Phonegap.ProjectProperties.SDKVersionRow",
	kind: "Phonegap.ProjectProperties.PickerRow",
	
	/**
	 * @private
	 */
	contentValueChanged: function() {
		//sort the value of the Android API version to garanty the display in the correct order. 
		Object.keys(Phonegap.UIConfiguration.androidSdkVersions)
		.sort(function(a, b) {return a - b;})
		.forEach(
			(function(key) {
				var itemState = key === this.value ? true : false;

				this.$.configurationPicker.createComponent({
					classes: "ares-project-properties-api-version-picker-element",
					content: key + " / " + Phonegap.UIConfiguration.androidSdkVersions[key], 
					value: key,
					active: itemState
				});
			}).bind(this)		
		);		
	},
	/**
	 * @private
	 * @override 
	 */
	activatePickerItemByContent: function(inContent){
		for (var key in this.$.configurationPicker.$) {
			if(this.$.configurationPicker.$[key].kind === "onyx.MenuItem"){
			this.$.configurationPicker.$[key].active = false;
				if(this.$.configurationPicker.$[key].value === inContent){
					this.$.configurationPicker.setSelected(this.$.configurationPicker.$[key]);
				}
			}
		}
	},

	/**
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
			//Initialize variables containing the values of "android-minSdkVersion" & "android-maxSdkVersion" attributs
			var minValue = parseInt(this.container.$["android-minSdkVersion"].value, 10);
			var maxValue = parseInt(this.container.$["android-maxSdkVersion"].value, 10);
			

			//Initialize variable containing the selected value
			var selectedValue = parseInt(inValue.selected.value, 10);
			
			if (this.name === "android-maxSdkVersion" && minValue > selectedValue ||
				this.name === "android-minSdkVersion" && maxValue < selectedValue) {
				
				var minSdkDisplayed = this.container.$["android-minSdkVersion"].$.configurationPickerButton.content;
				var maxSdkDisplayed = this.container.$["android-maxSdkVersion"].$.configurationPickerButton.content;

				this.showErrorMessage(minSdkDisplayed, "android-minSdkVersion", "Incorrect API level interval");
				this.showErrorMessage(maxSdkDisplayed, "android-maxSdkVersion", "Incorrect API level interval");

			
			} else {
				//Hide the error message
				this.hideErrorMessage("android-minSdkVersion");
				this.hideErrorMessage("android-maxSdkVersion");

				this.setValue(inValue.selected.value);							
			}
			
		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.jsonSection][this.name]);
	},

	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.name] = this.getValue();
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

		inputTip: "",
		activated: false,
		status: false,
		buttonTip: ""
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
				{
					kind: "onyx.Input",
					name: "AndroidImgPath",
					disabled: true
				}
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
		this.inputTipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttonTipChanged();
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
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateAndroidIconDensity: function (inSender, inValue) {
		this.setDensity(inValue.content);

		return true;
	},

	/** @private */
	valueChanged: function () {
		this.$.AndroidImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputTipChanged: function () {
		this.$.AndroidImgPath.setAttribute("title", this.inputTip);
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
	buttonTipChanged: function () {
		this.$.AndroidImgButton.setAttribute("title", this.buttonTip);
	},

	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]["android"].src);
		this.setDensity(config[this.name]["android"].density);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name][this.platform].src = this.getValue();
		config[this.name][this.platform].density = this.getDensity();
	}
});

/**
 * Define a row to let the user add the path to an  icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.ImgRow",
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

		description: undefined,
		activated: false,
		status: false,
		buttonTip: "",
	},
	components: [
		{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		},
			{
			kind: "FittableRows",
			components: [
				{
				kind: "onyx.InputDecorator",
				classes: "ares-project-properties-input-medium",
				components: [{
						kind: "onyx.Input",
						name: "ImgPath",
						disabled: true
					}
				]
			},
				{name: "errorMsg", showing: false, classes: "ares-project-properties-input-error-message"}
			]
		},
		{kind: "onyx.IconButton", name:"ImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"},
		{content: "Height", classes: "ares-project-properties-drawer-row-attribute-label"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-small",
			components: [{
					kind: "onyx.Input",
					name: "ImgHeight",
					onchange: "updateIconHeightValue"
				}
			]
		},
		{content: "Width", classes: "ares-project-properties-drawer-row-attribute-label"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-small",
			components: [{
					kind: "onyx.Input",
					name: "ImgWidth",
					onchange: "updateIconWidhtValue"
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
		this.inputTipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttonTipChanged();

		this.heightChanged();
		this.widthChanged();
		this.$.ImgWidth.setAttribute("placeholder", this.description);
		this.$.ImgHeight.setAttribute("placeholder", this.description);
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	heightChanged: function(){
		if(!isNaN(this.$.ImgHeight.value) && !isNaN(this.$.ImgWidth.value)){
			this.$.errorMsg.hide();
			this.$.ImgHeight.setValue(this.height || "");
			this.setErr(null);
		} else{
			var err = new Error("Height and Width values must be numbers");
			this.$.errorMsg.setContent(err.toString());
			this.$.errorMsg.show();
			this.setErr(err);
		}
	},

	/**
	 * @private
	 */
	widthChanged: function(){
		if(!isNaN(this.$.ImgHeight.value) && !isNaN(this.$.ImgWidth.value)){
			this.$.errorMsg.hide();
			this.$.ImgHeight.setValue(this.width || "");
			this.setErr(null);
		} else{
			var err = new Error("Height and Width values must be numbers");
			this.$.errorMsg.setContent(err.toString());
			this.$.errorMsg.show();
			this.setErr(err);
		}
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateIconHeightValue: function (inSender, inValue) {
		this.setHeight(inSender.getValue());

		return true;
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateIconWidhtValue: function (inSender, inValue) {
		this.setWidth(inSender.getValue());

		return true;
	},

	/** @private */
	valueChanged: function () {
		this.$.ImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputTipChanged: function () {
		this.$.ImgPath.setAttribute("title", this.inputTip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.ImgButton.show();
			this.statusChanged();
		} else {
			this.$.ImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.ImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.ImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttonTipChanged: function () {
		this.$.ImgButton.setAttribute("title", this.buttonTip);
	},

	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name][this.platform].src);
		this.setHeight(config[this.name][this.platform].height);
		this.setWidth(config[this.name][this.platform].width);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name][this.platform].src = this.getValue();
		config[this.name][this.platform].height = this.getHeight();
		config[this.name][this.platform].width = this.getWidth();
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.KeySelector",
	debug: false,
	kind: "Phonegap.ProjectProperties.Row",
	published: {
		keys: undefined,
		activeKeyId: undefined,
		activeKeyTitle: undefined,
		provider: undefined
	},
	components: [	
		{name: "label",	classes: "ares-project-properties-drawer-row-label"},
		{name: "activeSigningKey", classes: "ares-project-properties-show-sk"},
		{name: "loadingSingingKeys"} ,
		{name: "noSigningKeys", content: "No signing keys for this platform", showing: false},
		{
			name: "signingKeysContainer",
			showing: false,	
			kind: "FittableRows",
			components: [
				{
					name: "keyPicker", kind: "onyx.PickerDecorator", onSelect: "selectKey",
					components: [
						{kind: "onyx.PickerButton",	content: "Choose...", classes: "ares-project-properties-picker"}, 
						{kind: "onyx.Picker", name: "keys"}
					]
				},
				

				// android, ios & blackberry: key password
				{	
					kind: "onyx.InputDecorator", classes: "ares-project-properties-margin-right", showing: false, name: "passwdFrm",
					components: [
						{name: "keyPasswd",	kind: "onyx.Input",	classes: "ares-project-properties-password", type: "password", placeholder: "Password"}
					]
				},
			
				// android-only: keystore password
				{
					kind: "onyx.InputDecorator", name: "keystorePasswdFrm", showing: false, classes: "ares-project-properties-margin-right",
					components: [
						{name: "keystorePasswd", kind: "onyx.Input", classes: "ares-project-properties-password", type: "password", placeholder: "Keystore password"}
					]
				},
				{ kind: "onyx.Button", content: "Save",	ontap: "savePassword", showing: false, classes: "ares-project-properties-margin-right", name: "saveButton"}
			]
		}
	],
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
		this.setProvider(Phonegap.ProjectProperties.getProvider());
		
		this.activeKeyIdChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	activeKeyTitleChanged: function() {
		this.$.activeSigningKey.setContent(this.getActiveKeyTitle() );
		this.$.loadingSingingKeys.setContent(" Loading signing keys ...");
	},

	/** @public */
	setProjectConfig: function (config) {
		var platform = config[this.jsonSection][this.platform];
		this.setValue(platform && platform.keyId);
		this.setActiveKeyId(platform && platform.keyId);
		this.setActiveKeyTitle(platform && platform.keyTitle || "");

	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.platform].keyId = this.getValue();
	},

	/**
	 * @private
	 */
	keysChanged: function () {
		// Sanity
		this.keys = this.keys || [];

		//Clear the content of the Signing keys picker.
		this.clearPickerContent();

		var createPickerItem = function(item,state) {
			
			//check if the picker item wasn't already created.
			if(this.$.keys.$[item.id] === undefined){
				this.$.keys.createComponent({
					name: item.id,
					content: item.title,
					active: state
				});
			}
		};

		this.$.loadingSingingKeys.hide();
		this.$.activeSigningKey.hide();

		if(this.keys.length !== 0){

			this.$.signingKeysContainer.show();
			this.$.noSigningKeys.hide();

			// Fill
			enyo.forEach(this.keys, function (key) {
				if(key.id === this.getValue()) {
					createPickerItem.call(this, key, true);
				} else {
					createPickerItem.call(this, key, false);
				}
			}, this);

		} else {
			this.$.signingKeysContainer.hide();
			this.$.noSigningKeys.show();
		}
	},
	/**
	 * @private
	 */
	activeKeyIdChanged: function (old) {
		var key = this.getKey(this.activeKeyId);
		
		if (key) {
			// One of the configured keys
			if (this.platform === 'ios' || this.platform === 'blackberry') {
				// property named '.password' is defined by Phonegap
				this.$.keyPasswd.setValue(key.password || "");
				this.$.passwdFrm.show();
				this.$.saveButton.show();
			} else if (this.platform === 'android') {
				// properties named '.key_pw'and 'keystore_pw' are defined by Phonegap
				this.$.keyPasswd.setValue(key.key_pw || "");
				this.$.keystorePasswd.setValue(key.keystore_pw || "");
				this.$.keystorePasswdFrm.show();
				this.$.passwdFrm.show();
				this.$.saveButton.show();
			}
		}
	},
	/**
	 * @protected
	 */
	getKey: function (keyId) {
		if (keyId) {
			return enyo.filter(this.keys, function (key) {
				return key.id === keyId;
			}, this)[0];
		} else {
			return undefined;
		}
	},
	/**
	 * @private
	 */
	selectKey: function (inSender, inValue) {
		this.trace("sender:", inSender, "value:", inValue);
		enyo.forEach(this.keys, function (key) {
			if (key.title === inValue.content) {
				this.setActiveKeyId(key.id);
				this.setActiveKeyTitle(key.title);
				this.trace("selected key:", key);
			}
		}, this);

		this.activeKeyIdChanged();
	},
	/**
	 * @private
	 */
	clearPickerContent: function(){
		
		for (var key in this.$.keyPicker.$) {
					
			if (this.$.keyPicker.$[key].kind === "onyx.MenuItem"){
				this.$.keyPicker.$[key].destroy();
			}
		}
		this.$.keyPicker.render();
	},
	/**
	 * Return a signing key object from the displayed (showing === true) widgets
	 * @private
	 */
	getShowingKey: function () {
		var key = this.getKey(this.activeKeyId);
		if (!key) {
			return undefined;
		} else if (this.platform === 'ios' || this.platform === 'blackberry') {
			// property name '.password' is defined by Phonegap
			key.password = this.$.keyPasswd.getValue();
		} else if (this.platform === 'android') {
			// properties names '.key_pw'and 'keystore_pw' are defined by Phonegap
			key.key_pw = this.$.keyPasswd.getValue();
			key.keystore_pw = this.$.keystorePasswd.getValue();
		}
		return key;
	},
	/**
	 * @private
	 */
	savePassword: function (inSender, inValue) {
		this.trace("sender:", inSender, "value:", inValue);
		var key = this.getShowingKey();
		this.trace("platform:", this.platform, "key:", key);
		this.provider.setKey(this.platform, key);
	}
});
