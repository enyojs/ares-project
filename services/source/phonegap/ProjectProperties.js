/**
 * This kind hold the needed data to create 
 * @type {String}
 */
enyo.kind({
	name: "Phonegap.EditUiData",
	published: {

	},
	components: [],
	statics: {
		/**
		 * Array describing the contents of the common drawers shared with the Phonegap build platforms.
		 * It contains the folowing elements: 
		 * id: the kind's name of the drawer
		 * name: the value of the label associated to the drawer
		 * inputs: each element of this array contain data to generate an instance of {InputRow}
		 * pickers: each element of this array contain data to generate an instance of {PickerRow}
		 * checkboxes: each element of this array contain data to generate an instance of {CheckBoxRow}
		 * @type {Array}
		 */
		commonDrawersContent: [
			{
				id: "general",
				name: "General",
				rows: [
					{
						name: "phonegap-version",
						label:"Phonegap version",
						content:["2.9.0", "2.8.0", "2.7.0", "2.5.0", "2.3.0", "2.2.0", "2.1.0",
								"2.0.0", "1.9.0", "1.8.1", "1.7.0", "1.6.1", "1.5.0",
								"1.4.1", "1.3.0", "1.2.0", "1.1.0"
						], defaultValue: "2.9.0", 
						type: "Phonegap.ProjectProperties.PickerRow"  
					},
					{name: "orientation", label:"Orientation",content:["both", "landscape", "portrait"], defaultValue: "both", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "target-device",	label: "Target device", content: ["universal", "handset", "tablet"], defaultValue: "universal", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "fullscreen", label: "Fullscreen mode", content: ["true", "false"], defaultValue: "false", type: "Phonegap.ProjectProperties.PickerRow"}
				] 				
			}, 
			{
				id: "permissions",
				name: "Permissions",
				rows: [
					{name: "battery", label: "Battery",	content: "",defaultValue: "",  type: "Phonegap.ProjectProperties.CheckBoxRow"},
					{name: "camera", label: "Camera", content: "",defaultValue: "", type: "Phonegap.ProjectProperties.CheckBoxRow"},
					{name: "contact", label: "Contact",	content: "",defaultValue: "", type: "Phonegap.ProjectProperties.CheckBoxRow"},
					{name: "file", label: "File", content: "",defaultValue: "", type: "Phonegap.ProjectProperties.CheckBoxRow"},
					{name: "media",	label: "Media", content: "",defaultValue: "", type: "Phonegap.ProjectProperties.CheckBoxRow"},
					{name: "geolocation", label: "Geolocation", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.CheckBoxRow"},
					{name: "network", label: "Network", content: "",defaultValue: "",  type: "Phonegap.ProjectProperties.CheckBoxRow"},
					{name: "notification", label: "Notification", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.CheckBoxRow"},
					{name: "device", label: "Device", content: "", defaultValue: "",  type: "Phonegap.ProjectProperties.CheckBoxRow"}
				]
			}
		],

		/**
		 * Array describing the contents of the targeted Phonegap build platforms.
		 * It contains the folowing elements: 
		 * id: the kind's name of the drawer
		 * name: the value of the label associated to the drawer
		 * inputs: each element of this array contain data to generate an instance of {InputRow}
		 * pickers: each element of this array contain data to generate an instance of {PickerRow}
		 * checkboxes: each element of this array contain data to generate an instance of {CheckBoxRow}
		 * @type {Array}
		 */
		platformDrawersContent: [
			{
				id: "android",
				name: "Google Android",
				rows: [
					{name: "android-installLocation", label: "Install Location", content: ["internalOnly", "preferExternal", "auto"], defaultValue: "internalOnly", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "android-minSdkVersion", label: "Minimum SDK", content: "7", defaultValue: "7", type: "Phonegap.ProjectProperties.InputRow"},
					{name: "android-maxSdkVersion", label: "Maximum SDK", content: "22", defaultValue: "22", type: "Phonegap.ProjectProperties.InputRow"},
					{name: "splash-screen-duration", label: "Duration of the splashScreen", content: "3000", defaultValue: "3000", type: "Phonegap.ProjectProperties.InputRow"},
					{name: "load-url-timeout", label: "Load URL timeout", content: "6000", defaultValue: "6000", type: "Phonegap.ProjectProperties.InputRow"},
					{name: "iconAndroid", label: "Icon", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.AndroidImgRow"},
					{name: "splashScreenAndroid", label: "Splash screen", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.AndroidImgRow"}
				]				
			}, 
			{
				id: "ios",
				name: "Apple iOS",
				rows: [
					{name: "webviewbounce", label: "Web view bounce", content:  ["true", "false"], defaultValue: "true", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "prerendered-icon", label: "Prerendred icon", content: ["true", "false"], defaultValue: "false", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "ios-statusbarstyle", label: "Status Bar style", content: ["black-opaque", "black-translucent", "default"], defaultValue: "black-opaque",  type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "detect-data-types", label: "Detect Data type", content: ["true", "false"], defaultValue: "true", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "exit-on-suspend", label: "Exit on suspend", content: ["true", "false"], defaultValue: "false", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "show-splash-screen-spinner", label: "Show splash screen spinner", content: ["true", "false"], defaultValue: "false", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "auto-hide-splash-screen", label: "Auto-hide splash screen", content: ["true", "false"], defaultValue: "true", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "iconIos", label: "Icon", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.IosImgRow"},
					{name: "splashScreenIos", label: "Splash screen", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.IosImgRow"}
				]

			}, 
			{
				id: "winphone",
				name: "Microsoft Windows Phone 7",
				rows: [
					{name: "iconWinphone", label: "Icon", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.InputRow"},
					{name: "splashScreenWinphone", label: "Splash screen", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.InputRow"}
				]				
			}, 
			{
				id: "blackberry",
				name: "RIM Blackberry",
				rows: [
					{name: "disable-cursor", label: "Disable Cursor", content:  ["true", "false"], defaultValue: "false", type: "Phonegap.ProjectProperties.PickerRow"},
					{name: "iconBlackberry", label: "Icon", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.InputRow"},
					{name: "splashScreenBlackberry", label: "Splash screen", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.InputRow"}
				]
			}, 
			{
				id: "webos",
				name: "HP webOS 2",
				rows: [
					{name: "iconWebos", label: "Icon", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.InputRow"},
					{name: "splashScreenWebos", label: "Splash screen", content: "", defaultValue: "", type: "Phonegap.ProjectProperties.InputRow"}
				]
			}
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
	handlers: {
		onEditConfig: "saveConfig"
	}, 
	components: [{
			kind: "enyo.Scroller",
			fit: "true",
			classes: "ares-project-properties",
			components: [{
					kind: "FittableRows",
					components: [
						{
							classes: "ares-row ares-align-left",
							components: [
								{tag: "label", classes: "ares-fixed-label ares-small-label", content: "PhoneGap App ID"}, 
								{
									kind: "onyx.InputDecorator",
									components: [
										{kind: "Input", name: "pgConfId", attributes: { title: "unique identifier, assigned by build.phonegap.com"}}
									]
								}, 
								{kind: "onyx.Button", classes: "ares-project-properties-refresh-button", content: "Refresh...",	ontap: "refresh"}
							]
						}, 
						{name: "targetsRows", kind: "FittableRows",	classes: 'ares_projectView_switches'}
					]
				}
			]
		}
	],
	/**
	 * @type {Array}
	 */
	commonDrawers: Phonegap.EditUiData.commonDrawersContent,

	/**
	 * @type {Array}
	 */
	platformDrawers: Phonegap.EditUiData.platformDrawersContent, 

	/**
	 * @private
	 */
	create: function () {
		this.inherited(arguments);
		this.createAllDrawers();
	},

	createAllDrawers: function () {
		self = this;

		createDrawers(this.commonDrawers, this.platformDrawers);

		function createDrawers(inCommonDrawers, inPlatformDrawers) {
			createCommonDrawers(inCommonDrawers);
			createPlatformDrawers(inPlatformDrawers);
		}

		/**
		 * Create and initialise the content of all the common drawers which containe 
		 * parameters shared with all the platforms presented by
		 * Phonegap build.	
		 * @param  {Arary} inDrawers defined in the array {Phonegap.EditUiData.commonDrawersContent}
		 * @private
		 */
		function createCommonDrawers(inDrawers) {
			enyo.forEach(inDrawers, function (commonDrawer) {
				createCommonDrawer(commonDrawer);

				// get the last created drawer.
				var allDrawers = self.$.targetsRows.getComponents();
				var lastDrawer = allDrawers[allDrawers.length - 1];

				// A loop to Setup the content of each drawer.
				enyo.forEach(Phonegap.EditUiData.commonDrawersContent, function (drawerContent) {
					if (drawerContent.id === commonDrawer.id) {
						setUpDrawer(lastDrawer, drawerContent);
					}
				}, this);
			}, this);
		}

	
		/**
		 * Create and initialise the content of all the platforms drawers which containe 
		 * parameters of a specific platform presented by Phonegap build.	
		 * @param  {Arary} inDrawers defined in the array {Phonegap.EditUiData.platformDrawersContent}
		 * @private
		 */
		function createPlatformDrawers(inDrawers) {
			enyo.forEach(inDrawers, function (inDrawer) {
				createPlatformDrawer(inDrawer);

				// get the last created drawer.
				var allDrawers = self.$.targetsRows.getComponents();
				var lastDrawer = allDrawers[allDrawers.length - 1];
		
				// A loop to Setup the content of each drawer.
				enyo.forEach(Phonegap.EditUiData.platformDrawersContent, function (drawerContent) {
					if (drawerContent.id === inDrawer.id) {
						setUpDrawer(lastDrawer, drawerContent);
					}
				}, this);
			}, this);
		}

		/**
		 * Create one common drawer
		 * @param  {Array} inDrawer defined in the array {Phonegap.EditUiData.commonDrawersContent}
		 * @private
		 */
		function createCommonDrawer(inDrawer) {
			// Creation of the drawer.
			self.$.targetsRows.createComponent({
				kind: "Phonegap.ProjectProperties.Drawer",
				classes: "ares-row",
				name: inDrawer.id,
				drawerName: inDrawer.name				
			});
		}

		/**
		 * Create one platform drawer
		 * @param  {Array} inDrawer defined in the array {Phonegap.EditUiData.platformDrawersContent}
		 * @private
		 */
		function createPlatformDrawer(inDrawer) {
			self.$.targetsRows.createComponent({
				name: inDrawer.id,
				classes: "ares-row",
				kind: "Phonegap.ProjectProperties.Target",
				targetId: inDrawer.id,
				targetName: inDrawer.name,
				enabled: false
			});
		}

		/**
		 * Setup the rows of a drawer, a row contain a label with
		 * a UI widget which can be an : onyx.Picker, onyx.Input or onyx.Checkbox.
		 * The content of each UI widget is defined in the array
		 * {Phonegap.EditUiData.drawerContent}
		 *
		 * @param {Object} dwr        The drawer to fill
		 * @param {Array} dwrContent list of the rows that will be placed in the drawer
		 * @private
		 */

		function setUpDrawer(dwr, dwrContent) {
			// Creation of the pickers of the drawer if they existe.
			enyo.forEach(dwrContent.rows, function (row) {
				//this.log(allDrawers[allDrawers.length - 1], "+++++++");						
				dwr.$.drawer.createComponent({
					kind: row.type,
					name: row.name,
					label: row.label,
					value: row.content,	
					defaultValue: row.defaultValue							
				});
			}, this);
		}
	},

	/** public */
	setProjectConfig: function (config) {
		this.config = config;
		if (this.debug){
			this.log("config:", this.config);
		}
		this.config.enabled = true;

		this.$.pgConfId.setValue(config.appId || '');
		//this.$.pgIconUrl.setValue(config.icon.src || config.icon.src );

		this.config.targets = this.config.targets || {};		

		enyo.forEach(this.platformDrawers, function (target) {
			this.$.targetsRows.$[target.id].setProjectConfig(this.config.targets[target.id]);
		}, this);
		this.refresh();
	},
	/** public */
	getProjectConfig: function () {
		this.config.appId = this.$.pgConfId.getValue();
		//this.config.icon.src = this.$.pgIconUrl.getValue();

		enyo.forEach(this.platformDrawers, function (target) {
			this.config.targets[target.id] = this.$.targetsRows.$[target.id].getProjectConfig();
		}, this);

		if (this.debug){
			this.log("config:", this.config);
		}
		return this.config;
	},
	/**
	 * @protected
	 */
	refresh: function (inSender, inValue) {
		if (this.debug){
			this.log("sender:", inSender, "value:", inValue);
		}
		var provider = Phonegap.ProjectProperties.getProvider();
		provider.authorize(enyo.bind(this, this.loadKeys));
	},
	/**
	 * @protected
	 */
	configure: function (inSender, inValue) {
		if (this.debug){
			this.log("sender:", inSender, "value:", inValue);
		}
		this.doConfigure({
			id: 'phonegap'
		});
	},

	saveConfig: function(inSender, inValue)  {
		switch (inSender.name) {
			case "ConfigurationPicker" : {
				//this.log("Configuration object : ", this.config);
				this.log("Saving operation ... Originator: ", inSender.container.container.name , " Value: ", inValue.content);
				this.config.preferences[inSender.container.container.name] = inValue.content;
				this.log ("curent instance of config: ", this.config);
			} break; 

			case "ConfigurationCheckBox" : {
				this.log("Saving operation ... Originator: ", inSender.container.name , " Value: ", inSender.getValue());
				this.config.features[inSender.container.name] = inSender.getValue();
			} break; 

			case "ConfigurationInput" : {
				this.log("Saving operation ... Originator: ", inSender.container.container.name , " Value: ", inSender.value);
				
				this.config.preferences[inSender.container.container.name] = inSender.value;
				this.log ("curent instance of config: ", this.config);
			} break; 
			

			default : {

			}
		}		
		return true; //stop the bubbling
	}, 
	/**
	 * @protected
	 */
	loadKeys: function (err) {
		if (this.debug){
			this.log("err:", err);
		}
		if (err) {
			this.warn("err:", err);
		} else {
			var provider = Phonegap.ProjectProperties.getProvider();
					
			enyo.forEach(this.platformDrawers, function (target) {
				this.$.targetsRows.$[target.id].loadKeys(provider);
			}, this);
		}
	},
	statics: {
		getProvider: function () {
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
	classes: "ares-drawer",
	published: {
		targetId: "",
		targetName: "",
		enabled: "",
		fold: true,
		keys: {},
		config: {}
	},
	components: [
		 
		{tag: "div", classes: "ares-project-properties-label-background", ontap: "unfold", 
		components: [
			{name: "targetChkBx", kind: "onyx.Checkbox", onchange: "updateDrawer"},
			{tag: "label", name: "targetLbl", classes: "ares-project-properties-platform_drawer_header"}
		]},
		 
		{name: "drawer", orient: "v", kind: "onyx.Drawer",	open: false}
	],
	/**
	 * @private
	 */
	create: function () {
		this.inherited(arguments);
		this.targetNameChanged();
	},
	setProjectConfig: function (config) {
		if (this.debug){
			this.log("id:", this.targetId, "config:", config);
		}
		this.config = config;
		this.setEnabled( !! this.config);
		if (this.enabled && this.$.drawer.$.keySelector) {
			this.$.drawer.$.keySelector.setActiveKeyId(this.config.keyId);
		}
	},
	getProjectConfig: function () {
		if (this.enabled && this.$.drawer.$.keySelector) {
			this.config.keyId = this.$.drawer.$.keySelector.getActiveKeyId();
		}
		if (this.debug){
			this.log("id:", this.targetId, "config:", this.config);
		}
		return this.config;
	},
	/**
	 * @private
	 */
	targetNameChanged: function (old) {
		if (this.debug) {
			this.log(old, "->", this.enabled);
		}
		this.$.targetLbl.setContent(this.targetName);
	},
	/**
	 * @private
	 */
	enabledChanged: function (old) {
		if (this.debug){
			this.log("id:", this.targetId, old, "->", this.enabled);
		}
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
	loadKeys: function (provider) {

		if ((this.targetId === 'android' ||
			this.targetId === 'ios' ||
			this.targetId === 'blackberry')) {
			if (this.debug){
				this.log("id:", this.targetId);
			}

			if (this.$.drawer.$.keySelector) {
				this.$.drawer.$.keySelector.destroy();
			}

			var keys = provider.getKey(this.targetId);
			if (this.debug){
				this.log("id:", this.targetId, "keys:", keys);
			}
			if (keys) {
				this.$.drawer.createComponent({
					name: "keySelector",
					kind: "Phonegap.ProjectProperties.KeySelector",
					targetId: this.targetId,
					keys: keys,
					classes: "ares-row ares-drawer",
					activeKeyId: (this.config && this.config.keyId)
				});
				this.$.drawer.$.keySelector.render();
				this.$.drawer.$.keySelector.setProvider(provider);
			}
		}
	},
	/**
	 * @private
	 */
	updateDrawer: function () {
		
		this.setEnabled(this.$.targetChkBx.checked);
	},

	unfold: function () {
		this.$.drawer.setOpen(this.fold);
		this.fold = !this.fold;
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.Drawer",
	debug: true,
	classes: "ares-drawer",
	published: {
		drawerName: "",
		config: {},
		fold: true
	},
	components: [
			{tag: "div", classes: "ares-project-properties-label-background", ontap: "unfold",
			components: [
				{tag: "label", name: "drawerLbl", classes: "ares-project-properties-common_drawer_header"}
			]},			 
			{name: "drawer", orient: "v", kind: "onyx.Drawer", open: false}

	],
	/**
	 * @private
	 */
	create: function () {
		this.inherited(arguments);
		this.drawerNameChanged();
	},

	/**
	 * Fold/Unfold the content of a drawer
	 * @private
	 */
	unfold: function () {
		this.$.drawer.setOpen(this.fold);
		this.fold = !this.fold;
	},

	drawerNameChanged: function () {
		this.$.drawerLbl.setContent(this.drawerName);
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
		{
			components: [
				{
					classes: "ares-row",
					components: [
						{tag: "label", classes: "ares-project-properties-drawer-row-label", content: "Signing Key"}, 
						{name: "keyPicker", kind: "onyx.PickerDecorator", onSelect: "selectKey",
							components: [
								{kind: "onyx.PickerButton",	content: "Choose...", classes: "middle-width ares-margin-right"}, 
								{kind: "onyx.Picker", name: "keys"}
							]
						},
						// android, ios & blackberry: key password
						{
							kind: "onyx.InputDecorator", classes: "ares-margin-right", 
							components: [
								{content: "Key"}, 
								{name: "keyPasswd",	kind: "onyx.Input",	classes: "ares-small-input", type: "password",	placeholder: "Password"}
							]
						},
						// android-only: keystore password
						{
							kind: "onyx.InputDecorator", name: "keystorePasswdFrm",	classes: "ares-margin-right", showing: false,
							components: [
								{content: "Keystore"}, 
								{name: "keystorePasswd", kind: "onyx.Input", classes: "ares-small-input", type: "password",	placeholder: "Password"}
							]
						}, 
						{kind: "onyx.Button", content: "Save",	ontap: "savePassword"}
					]
				}
			]
		}
	],
	create: function () {
		this.inherited(arguments);
		this.keysChanged();
		this.activeKeyIdChanged();
	},
	/**
	 * @private
	 */
	keysChanged: function (old) {
		if (this.debug){
			this.log("id:", this.targetId, old, "->", this.keys);
		}

		// Sanity
		this.keys = this.keys || [];

		// Make sure 'None' (id == -1) is always available
		if (enyo.filter(this.keys, function (key) {
			return key.id === undefined;
		})[0] === undefined) {
			this.keys.push({
				id: undefined,
				title: "None"
			});
		}

		// Fill
		enyo.forEach(this.keys, function (key) {
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
	activeKeyIdChanged: function (old) {
		var key = this.getKey(this.activeKeyId);
		if (this.debug) {
			this.log("id:", this.targetId, old, "->", this.activeKeyId, "key:", key);
		}
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
		this.log("sender:", inSender, "value:", inValue);
		enyo.forEach(this.keys, function (key) {
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
	getShowingKey: function () {
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
	savePassword: function (inSender, inValue) {
		if (this.debug) {
			this.log("sender:", inSender, "value:", inValue);
		}
		var key = this.getShowingKey();
		if (this.debug) {
			this.log("targetId:", this.targetId, "key:", key);
		}
		this.provider.setKey(this.targetId, key);
	}
});

/**
 * This Kind define a row containing a checkbox widget and attached to a drawer in {Phonegap.ProjectProperties}
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
		//this.initiliseCheckBox();
		this.labelChanged();
	},
	labelChanged: function () {
		this.$.labelValue.setContent(this.name);
	},
	updateConfigurationValue: function (inSender, inValue) {
		this.bubble("onEditConfig", inValue);
	}
});

/**
 * This Kind define a row containing an Input widget and attached to a drawer in {Phonegap.ProjectProperties}
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.InputRow",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
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
		this.log(Phonegap.EditUiData.commonDrawersContent[0].rows[1].defaultValue);
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		this.$.ConfigurationInput.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		this.bubble("onEditConfig", inValue);
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
		/**
		 * The label text used for the row.
		 * @type {String}
		 */
		label: "",

		/**
		 * The name of the Picker.
		 * @type {String}
		 */
		name: "",

		/**
		 * The content of the Picker.
		 * @type {String}
		 */
		value: "", 

		config: {},

		selectedValue: "",

		defaultValue: "" 
	},
	handlers: {
		//onPopupClose : 'saveValue'
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
		enyo.forEach(this.value, function (aValue) {
			this.log("this.defaultValue: ", this.defaultValue);
			if (aValue === this.defaultValue) {
				this.$.ConfigurationPicker.createComponent({content: aValue, active: true});
			} else {
				this.$.ConfigurationPicker.createComponent({content: aValue});
			}
			
		}, this);
	}, 
	//DELETE THIS FUNCTION WHEN CLEANIING
	pickerValueUpdate: function(inEvent, inValue){
		this.selectedValue = inValue.content; 

	},
	updateConfigurationValue: function (inSender, inValue) {
		this.bubble("onEditConfig", inValue);
	},
	saveValue: function(){		
		//this.config.preferences[this.name] = this.selectedValue;
		return true;
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
		imgType: "", 
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
				{kind: "onyx.Input", name: "imgPath"}
			]
		}, 
		{
			kind: "onyx.PickerDecorator",
			components: [
				{kind: "onyx.PickerButton"},
				{
					kind: "onyx.Picker", name: "Attribute01", onSelect: "updateConfigurationValue",
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
		this.$.imgPath.setValue(this.value);
	},

	updateConfigurationValue: function (inSender, inValue) {
		this.bubble("onEditConfig", inValue);
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

		width: "",

		height: "",

		defaultValue: ""
	},
	handlers: {
		onPopupClose : 'saveValue', 
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
					name: "IosIconInput"
				}
			]
		},
		{content: "Lenght"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-small",
			components: [{
					kind: "onyx.Input",
					name: "IosIconLenghtInput"
				}
			]
		},
		{content: "width"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-small",
			components: [{
					kind: "onyx.Input",
					name: "IosIconWidthInput"
				}
			]
		}


	],

	create: function () {
		this.inherited(arguments);
		this.labelChanged();
		//this.valueChanged();
	},

	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	valueChanged: function () {
		var input = this.$.IosIconInput;
		input.setValue(this.value);
	},

	updateConfig: function(inOriginateur, inConfig) {
		this.log("The config object is recieved: ", inConfig);
		return true;// stop the waterfall.
	}
});


