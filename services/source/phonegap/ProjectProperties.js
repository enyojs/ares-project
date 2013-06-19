

enyo.kind({
	name: "Phonegap.EditUiData",
	published: {

	},
	components: [
		{}

	],
	statics: {
		
		general: [
			["phonegapVersion" ,"Phonegap version" ,
					["2.8.0", "2.7.0", "2.5.0", "2.3.0", "2.2.0", "2.1.0", 
					 "2.0.0", "1.9.0", "1.8.1", "1.7.0", "1.6.1", "1.5.0", 
					 "1.4.1", "1.3.0", "1.2.0", "1.1.0"]],
			["orientation", "Orientation" ,["both", "landscape", "portrait"]],
			["targetDevice" ,"Target device" ,["universal", "handset", "tablet"]],
			["fullScreen" ,"Fullscreen mode" ,["true", "false"]],
			 
		],
		//TODO: remove the row name.
		//in this array: 
		//the first element is the name of the row
		//the second element is ne label value
		permissions: [
			["BatteryRow", "battery"],
			["CameraRow", "camera"], 
			["ContactRow", "contact"],
			["FileRow", "file"],
			["GeolocationRow", "geolocation"],
			["MediaRow", "media"],
			["NetworkRow", "network"],
			["NotificationRow", "notification"],
			["DeviceRow", "device"]
		],
		//in this array: 
		//the first sub-element is the name of the input
		//the second sub-element is ne label value
		android: [
			["minSDK", "Minimum SDK"],
			["maxSDK", "Maximum SDK"],
			["splashScreenDuration", "Duration of the splashScreen"],
			["loadUrlTimeout", "Load URL timeout"]
		], 

		iosPickers: [
			["webviewBounce", "Web view bounce", ["true", "false"]], 
			["prerenderedIcon", "Prerendred icon", ["true", "false"]],
			["statusBarStyle", "Status Bar style", ["black-opaque", "black-translucent", "default"]],
			["detectDataTypes", "Detect Data type", ["true", "false"]],
			["exitOnSuspend", "Exit on suspend", ["true", "false"]],
			["showSplashScreenSpinner", "Show splash screen spinner", ["true", "false"]],
			["autoHideSplashScreen", "Auto-hide splash screen", ["true", "false"]]



		]


	}
});




/**
 * UI: Phonegap pane in the ProjectProperties popup
 * @name Phonegap.ProjectProperties
 */

enyo.kind({
	name: "Phonegap.ProjectProperties",
	kind: "Ares.ProjectProperties",
	debug: false,
	published: {
		config: {}
	},
	events: {
		onConfigure: ""
	},
	components: [
		{kind:"enyo.Scroller", fit:"true", classes:"ares-project-properties",components:[
			{kind: "FittableRows", components: [
				{classes:"ares-row ares-align-right", components :[
					{tag:"label", classes: "ares-fixed-label ares-small-label", content: "PhoneGap App ID:"},
					{kind: "onyx.InputDecorator", components: [
						{kind: "Input", name: "pgConfId",
							attributes: {title: "unique identifier, assigned by build.phonegap.com"}
						}
					]},
					{tag:"label", classes: "ares-fixed-label ares-small-label", content: "Icon URL:"},
					{kind: "onyx.InputDecorator", components: [
						{kind: "Input", name: "pgIconUrl",
							attributes: {title: "Relative location of the application icon. Defaults to Enyo icon."}
						}
					]}
				]},
				{content: "Targets:", classes:"ares-row ares-align-right", components: [
					
					{kind: "onyx.Button", content: "Refresh...", ontap: "refresh"},
				]},
				{name: "targetsRows", kind: "FittableRows", classes: 'ares_projectView_switches'}
			]}
		]}
	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
		this.setUpDrawers();
		this.setUpGeneralDrawer();
		this.setUpPermissionDrawer();
		this.setUpAndroidDrawer();
		this.setUpIOSDrawer();


		this.log(Phonegap.Build.DEFAULT_PROJECT_CONFIG);
	},

	//TODO : change to nested function
	setUpDrawers: function(){
		this.targets = Phonegap.ProjectProperties.platforms;
		
		enyo.forEach(this.targets, function(target) {
			this.$.targetsRows.createComponent({
				name: target.id,
				classes:"ares-row",
				kind: "Phonegap.ProjectProperties.Target",
				targetId: target.id,
				targetName: target.name,
				enabled: false
			});			
		}, this);
	},

	setUpGeneralDrawer: function(){
		var generalUiData = Phonegap.EditUiData.general; 

		enyo.forEach(generalUiData, function(row){
			this.$.targetsRows.$.general.$.targetDrw.createComponent({
				kind: "PickerRow",
				name: row[0],
				label: row[1], 
				value: row[2]
			});		
		}, this);

	},

	//TODO :change to a nested function when refactoring
	setUpPermissionDrawer: function(){
		var permissionsUiData = Phonegap.EditUiData.permissions;
		
		enyo.forEach(permissionsUiData, function(row){
			this.$.targetsRows.$.permissions.$.targetDrw.createComponent({
				kind: "CheckBoxRow",
				name: row[0],
				label: row[1]
			});		
		}, this);
	}, 

	setUpAndroidDrawer: function(){
		var androidInput = Phonegap.EditUiData.android;
		var androidConfig = phongap.configData.androidSpecific;
		
		enyo.forEach(androidInput, function(row){
			this.$.targetsRows.$.android.$.targetDrw.createComponent({
				kind: "inputRow",
				name: row[0],
				label: row[1], 
				value: androidConfig[row[0]]
			});		
		}, this);
	},

	setUpIOSDrawer: function(){
		var ioslUiData = Phonegap.EditUiData.iosPickers; 

		enyo.forEach(ioslUiData, function(row){
			this.$.targetsRows.$.ios.$.targetDrw.createComponent({
				kind: "PickerRow",
				name: row[0],
				label: row[1], 
				value: row[2]
			});		
		}, this);

	},

	/** public */
	setProjectConfig: function(config) {
		this.config = config;
		if (this.debug) this.log("config:", this.config);
		this.config.enabled = true;

		this.$.pgConfId.setValue(config.appId || '' );
		this.$.pgIconUrl.setValue(config.icon.src || config.icon.src );

		this.config.targets = this.config.targets || {};

		enyo.forEach(this.targets, function(target) {
			this.$.targetsRows.$[target.id].setProjectConfig(this.config.targets[target.id]);
		}, this);
		this.refresh();
	},
	/** public */
	getProjectConfig: function() {
		this.config.appId   = this.$.pgConfId.getValue();
		this.config.icon.src = this.$.pgIconUrl.getValue();

		enyo.forEach(this.targets, function(target) {
			this.config.targets[target.id] = this.$.targetsRows.$[target.id].getProjectConfig();
		}, this);
		
		if (this.debug) this.log("config:", this.config);
		return this.config;
	},
	/**
	 * @protected
	 */
	refresh: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var provider = Phonegap.ProjectProperties.getProvider();
		provider.authorize(enyo.bind(this, this.loadKeys));
	},
	/**
	 * @protected
	 */
	configure: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		this.doConfigure({id: 'phonegap'});
	},
	/**
	 * @protected
	 */
	loadKeys: function(err) {
		if (this.debug) this.log("err:", err);
		if (err) {
			this.warn("err:", err);
		} else {
			var provider = Phonegap.ProjectProperties.getProvider();
			enyo.forEach(this.targets, function(target) {
				this.$.targetsRows.$[target.id].loadKeys(provider);
			}, this);
		}
	},
	statics: {
		platforms: [
			{id: 'general', name: "General"}, 
			{id: 'permissions', name: "Permissions"},
			{id: 'android',		name: "Google Android"},
			{id: 'ios',		name: "Apple iOS"},
			{id: 'winphone',	name: "Microsoft Windows Phone 7"},
			{id: 'blackberry',	name: "RIM Blackberry"},
			{id: 'webos',		name: "HP webOS 2"}
		],
		getProvider: function() {
			this.provider = this.provider || ServiceRegistry.instance.resolveServiceId('phonegap');
			return this.provider;
		}
	}
});

/**
 * This widget is aware of the differences between the Phoneap Build targets.
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.Target",
	debug: false,
	published: {
		targetId: "",
		targetName: "",
		enabled: "",
		fold: true,
		keys: {},
		config: {}
	},
	components: [
			{name: "targetChkBx", kind: "onyx.Checkbox", onchange: "updateDrawer"},
			{tag:"label", name: "targetLbl", classes:"ares-label", content: ""},
			{name: "DetailsButton", kind: "onyx.Button", content: "Details", 
			 ontap: "unfold", style:"float:right;"},
			{name: "targetDrw", classes:"ares-row ares-drawer", orient: "v", kind: "onyx.Drawer", open: false},

	],
	/**
	 * @private
	 */
	create: function() {
		this.inherited(arguments);
		this.targetNameChanged();
	},
	setProjectConfig: function(config) {
		if (this.debug) this.log("id:", this.targetId, "config:", config);
		this.config = config;
		this.setEnabled(!!this.config);
		if (this.enabled && this.$.targetDrw.$.keySelector) {
			 this.$.targetDrw.$.keySelector.setActiveKeyId(this.config.keyId);
		}
	},
	getProjectConfig: function() {
		if (this.enabled && this.$.targetDrw.$.keySelector) {
			this.config.keyId = this.$.targetDrw.$.keySelector.getActiveKeyId();
		}
		if (this.debug) this.log("id:", this.targetId, "config:", this.config);
		return this.config;
	},
	/**
	 * @private
	 */
	targetNameChanged: function(old) {
		//if (this.debug) this.log(old, "->", this.enabled);
		this.$.targetLbl.setContent(this.targetName);
	},
	/**
	 * @private
	 */
	enabledChanged: function(old) {
		if (this.debug) this.log("id:", this.targetId, old, "->", this.enabled);
		this.$.targetChkBx.setChecked(this.enabled);
		this.updateDrawer();
		if (this.enabled) {
			this.config = this.config || {};
		} else {
			this.config = false;
		}
	},
	/**
	 * @protected
	 */
	loadKeys: function(provider) {
		if ((this.targetId === 'android' ||
		     this.targetId === 'ios' ||
		     this.targetId === 'blackberry')) {
			if (this.debug) this.log("id:", this.targetId);

			if (this.$.targetDrw.$.keySelector) {
				this.$.targetDrw.$.keySelector.destroy();
			}

			var keys = provider.getKey(this.targetId);
			if (this.debug) this.log("id:", this.targetId, "keys:", keys);
			if (keys) {
				this.$.targetDrw.createComponent({
					name: "keySelector",
					kind: "Phonegap.ProjectProperties.KeySelector",
					targetId: this.targetId,
					keys: keys,
					classes:"ares-row ares-drawer",
					activeKeyId: (this.config && this.config.keyId)
				});
				this.$.targetDrw.$.keySelector.render();
				this.$.targetDrw.$.keySelector.setProvider(provider);
			}
		}
	},
	/**
	 * @private
	 */
	updateDrawer: function() {
		//this.$.targetDrw.setOpen(this.$.targetChkBx.checked);
		this.setEnabled(this.$.targetChkBx.checked);
	},

	 unfold: function (){
	    this.$.targetDrw.setOpen(this.fold);
	    this.fold = ! this.fold;
    } 
});

enyo.kind({
	name: "Phonegap.ProjectProperties.KeySelector",
	debug: false,
	kind: "FittableRows",
	published: {
		targetId: "",
		keys: undefined,
		activeKeyId: undefined,
		provider: undefined
	},
	components: [
		{components: [
			{classes:"ares-row", components:[
				{tag: "label", classes:"ares-fixed-label ares-small-label", content: "Signing Key: "},
				{name: "keyPicker", kind: "onyx.PickerDecorator", onSelect: "selectKey", components: [
					{kind: "onyx.PickerButton", content: "Choose...", classes:"middle-width ares-margin-right"},
					{kind: "onyx.Picker", name: "keys"}
				]},
				// android, ios & blackberry: key password
				{kind: "onyx.InputDecorator", classes:"ares-margin-right", components: [
					{content: "Key:"},
					{name: "keyPasswd", kind: "onyx.Input", classes:"ares-small-input", type: "password", placeholder: "Password"}
				]},
				// android-only: keystore password
				{kind: "onyx.InputDecorator", name: "keystorePasswdFrm", classes:"ares-margin-right", showing: false, components: [
					{content: "Keystore:"},
					{name: "keystorePasswd", kind: "onyx.Input", classes:"ares-small-input", type: "password", placeholder: "Password"}
				]},
				{kind: "onyx.Button", content: "Save", ontap: "savePassword"}
			]}
		]}
	],
	create: function() {
		this.inherited(arguments);
		this.keysChanged();
		this.activeKeyIdChanged();
	},
	/**
	 * @private
	 */
	keysChanged: function(old) {
		if (this.debug) this.log("id:", this.targetId, old, "->", this.keys);

		// Sanity
		this.keys = this.keys || [];

		// Make sure 'None' (id == -1) is always available
		if (enyo.filter(this.keys, function(key) {
			return key.id === undefined;
		})[0] === undefined) {
			this.keys.push({id: undefined, title: "None"});
		}

		// Fill
		enyo.forEach(this.keys, function(key) {
			this.$.keys.createComponent({
				name: key.id,
				content: key.title,
				active: (key.id === this.activeKeyId)
			});
		}, this);
	},
	/**
	 * @private
	 */
	activeKeyIdChanged: function(old) {
		var key = this.getKey(this.activeKeyId);
		if (this.debug) this.log("id:", this.targetId, old, "->", this.activeKeyId, "key:", key);
		if (key) {
			// One of the configured keys
			if (this.targetId === 'ios' || this.targetId === 'blackberry') {
				// property named '.password' is defined by Phonegap
				this.$.keyPasswd.setValue(key.password || "");
			} else if (this.targetId === 'android') {
				// properties named '.key_pw'and 'keystore_pw' are defined by Phonegap
				this.$.keyPasswd.setValue(key.key_pw || "");
				this.$.keystorePasswd.setValue(key.keystore_pw || "");
				this.$.keystorePasswdFrm.show();
			}
		}
	},
	/**
	 * @protected
	 */
	getKey: function(keyId) {
		if (keyId) {
			return enyo.filter(this.keys, function(key) {
				return key.id === keyId;
			}, this)[0];
		} else {
			return undefined;
		}
	},
	/**
	 * @private
	 */
	selectKey: function(inSender, inValue) {
		this.log("sender:", inSender, "value:", inValue);
		enyo.forEach(this.keys, function(key) {
			if (key.title === inValue.content) {
				this.setActiveKeyId(key.id);
				this.log("selected key:", key);
			}
		}, this);
	},
	/**
	 * Return a signing key object from the displayed (showing === true) widgets
	 * @private
	 */
	getShowingKey: function() {
		var key = this.getKey(this.activeKeyId);
		if (!key) {
			return undefined;
		} else if (this.targetId === 'ios' || this.targetId === 'blackberry') {
			// property name '.password' is defined by Phonegap
			key.password = this.$.keyPasswd.getValue();
		} else if (this.targetId === 'android') {
			// properties names '.key_pw'and 'keystore_pw' are defined by Phonegap
			key.key_pw = this.$.keyPasswd.getValue();
			key.keystore_pw = this.$.keystorePasswd.getValue();
		}
		return key;
	},
	/**
	 * @private
	 */
	savePassword: function(inSender, inValue) {
		if (this.debug) this.log("sender:", inSender, "value:", inValue);
		var key = this.getShowingKey();
		if (this.debug) this.log("targetId:", this.targetId, "key:", key);
		this.provider.setKey(this.targetId, key);
	}
});

enyo.kind({
	name: "CheckBoxRow",
	kind: "FittableColumns",
	style: "margin-top: 10px; height: 32px;",
	debug: true,
	published: {
		label: "",
		activated: false
	},
	components: [		
			{kind: "onyx.Checkbox",
		     name: "checkBox" ,
		     onchange: "permissionChanged",
		    style: "margin-left: 30px; margin-right: 50px;"
		    }, 
		    {name: "labelValue", content: this.label}
		     
	],
	create: function(){
		this.inherited(arguments);
		this.labelChanged();
	},

	labelChanged: function(){
		this.$.labelValue.setContent(this.label);
	}, 
	
	permissionChanged: function(){
		this.activated = !this.activated;
		Phonegap.Build.DEFAULT_PROJECT_CONFIG.features[this.label] = this.activated;
		if (this.debug){
			//this.log("the permission ", this.label, "is set to ",
			//Phonegap.Build.DEFAULT_PROJECT_CONFIG.features[this.label]);
		}

	}
});


enyo.kind({
	name: "inputRow",
	 kind: "FittableColumns",
	 style: "margin-top: 10px; height: 32px",       
	debug: true,
	published: {
		/**
		 * The label text used for the row.
		 * @type {String}
		 */
		label: "",
		
		/**
		 * The name of the input.
		 * @type {String}
		 */
		name: "",
		
		/**
		 * The value of the the input.
		 * @type {String}
		 */
		value: ""
	},
	components: [
		  	{name: "label",  
		     style: "width: 13em; margin-left:3em;"},
		    {kind: "onyx.InputDecorator", 
		     components: [
		        {kind: "onyx.Input", name: "configurationInput"}
		      ]
			}
			    
	],
	create: function(){
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},
	labelChanged: function(){
		this.$.label.setContent(this.label);
	},
	valueChanged: function(){
		var input = this.$.configurationInput;
		input.setValue(this.value);	
	}
});

enyo.kind({
    name: "PickerRow",
 	kind: "FittableColumns", 
  	style: "margin-top: 10px;", 
  	debug: true,
  	published: {
		  	label: "",
		  	name: "",
		  	value: ""
  	},    
 	components:  [
		{name: "label", style: "width: 13em; margin-left:3em;"},
		{kind: "onyx.PickerDecorator", 	 
    	 components: [ 
            {kind: "onyx.PickerButton"},
            {kind: "onyx.Picker", name:"configurationPicker"}
   			]                                               
		}
	], 

	create: function(){
		this.inherited(arguments);
		this.labelChanged();
		this.valueChanged();
	},

	labelChanged: function(){
		this.$.label.setContent(this.label);
	},

	valueChanged: function(){
		
		enyo.forEach(this.value, function(aValue) {
		this.$.configurationPicker.createComponent({content: aValue});			
		}, this);

		this.log("this configurationPicker: ", this.$.configurationPicker);
	}
});

