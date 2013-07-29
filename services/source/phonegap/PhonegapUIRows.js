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
		value: ""
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
	valueChanged: function () {
		this.$.ConfigurationCheckBox.setChecked(this.value);		
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
		this.setValue(config.features[this.name]);
	},
	/** @public */
	getProjectConfig: function (config) {
		config.features[this.name] = this.getValue();
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
					classes: "enyo-unselectable"
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
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config.preferences[this.name]);
	},
	/** @public */
	getProjectConfig: function (config) {
		config.preferences[this.name] = this.getValue();
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.AutoGenerateXML",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
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
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	valueChanged: function () {
		this.$.ConfigurationCheckBox.setChecked(this.value);		
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
		this.setValue(config.autoGenerateXML);
	},
	/** @public */
	getProjectConfig: function (config) {
		config.autoGenerateXML = this.getValue();
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
	valueChanged: function () {
		this.$.ConfigurationInput.setValue(this.value);
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
		contentValue: ""
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
		this.setValue(inValue.content);
		
		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config.preferences[this.name]);
	},
	/** @public */
	getProjectConfig: function (config) {
		config.preferences[this.name] = this.getValue();
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
				{
					kind: "onyx.Input", 
					name: "AndroidImgPath", 
					classes: "enyo-unselectable"
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
		config[this.name]["android"].src = this.getValue();
		config[this.name]["android"].density = this.getDensity();
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
					classes: "enyo-unselectable"
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
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateIosIconHeightValue: function (inSender, inValue) {
		this.setHeight(inValue.content);

		return true;
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 * 
	 * @private
	 */
	updateIosIconWidhtValue: function (inSender, inValue) {
		this.setWidth(inValue.content);

		return true;
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
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]["ios"].src);
		this.setHeight(config[this.name]["ios"].height);
		this.setWidth(config[this.name]["ios"].width);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name]["ios"].src = this.getValue();
		config[this.name]["ios"].height = this.getHeight();
		config[this.name]["ios"].width = this.getWidth();
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
					classes: "enyo-unselectable"
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
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]["general"].src);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name]["general"].src = this.getValue();
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
					classes: "enyo-unselectable"
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
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]["winphone"].src);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name]["winphone"].src = this.getValue();
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
					classes: "enyo-unselectable"
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
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]["blackberry"].src);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name]["blackberry"].src = this.getValue();
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
					classes: "enyo-unselectable"
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
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]["webos"].src);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name]["webos"].src = this.getValue();
	}
});
