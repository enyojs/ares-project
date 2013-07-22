/* global ares, Phonegap, ServiceRegistry */

/**
 * Hold the needed data to create the UI Projet -> Edit. Actually it's used in : 
 * "ProjectProperties.js", "PhonegapUIRows.js" & "Build.js".
 * In this kind, the data are defined in the statics attribute and are structured this way : 
 * * Array of drawers : a drawer contain the following attributs  : 
 * - id : define the name of the drawer's component that will be created
 * - name: define the name of the drawer's label
 * - rows: define the content of the drawer, a drawer contains an array of rows and each row contain the following attributs : 
 * -- name: used to create the UI widget that hold the name of the row, this name is exactely the name of the xml tag of the file 
 *          config.xml that will be generated (except for splashScreen row)
 * -- label : the content of the label of the row
 * -- content: the content of the row, the format of this content can change depending on the type of the UI widget used (picker, input, ...)
 * -- defaultValue: the default value displayed in the widget
 * -- type: contain the last part of the name of the kind that will be used to define a row, these kinds are defined in
 * 			the "PhonegapUIRows.js"
 * @type {String}
 */
enyo.kind({
	name: "Phonegap.UIConfiguration",
	published: {

	},
	components: [],
	statics: {

		commonDrawersContent: [
			{
				id: "general",
				name: "General",
				rows: [
					{
						name: "phonegap-version",
						label:"Phonegap version",
						content:["2.9.0", "2.7.0", "2.5.0", "2.3.0", "2.2.0", "2.1.0", "2.0.0"],
						defaultValue: "2.9.0",
						type: "PickerRow"
					},
					{name: "orientation", label:"Orientation",content:["both", "landscape", "portrait"], defaultValue: "both", type: "PickerRow"},
					{name: "target-device",	label: "Target device", content: ["universal", "handset", "tablet"], defaultValue: "universal", type: "PickerRow"},
					{name: "fullscreen", label: "Fullscreen mode", content: ["true", "false"], defaultValue: "false", type: "PickerRow"},
					{name: "icon", label: "Icon", content: "icon.png", defaultValue: "icon.png", type: "GeneralImgRow"},
					{name: "splashScreen", label: "SplashScreen", content: "", defaultValue: "", type: "GeneralImgRow"}
				]		
			}, 
			{
				id: "permissions",
				name: "Permissions",
				rows: [
					{name: "battery", label: "Battery",	content: "",defaultValue: "",  type: "CheckBoxRow"},
					{name: "camera", label: "Camera", content: "",defaultValue: "", type: "CheckBoxRow"},
					{name: "contact", label: "Contact",	content: "",defaultValue: "", type: "CheckBoxRow"},
					{name: "file", label: "File", content: "",defaultValue: "", type: "CheckBoxRow"},
					{name: "media",	label: "Media", content: "",defaultValue: "", type: "CheckBoxRow"},
					{name: "geolocation", label: "Geolocation", content: "", defaultValue: "", type: "CheckBoxRow"},
					{name: "network", label: "Network", content: "",defaultValue: "",  type: "CheckBoxRow"},
					{name: "notification", label: "Notification", content: "", defaultValue: "", type: "CheckBoxRow"},
					{name: "device", label: "Device", content: "", defaultValue: "",  type: "CheckBoxRow"}
				]
			}
		],


		platformDrawersContent: [
			{
				id: "android",
				name: "Google Android",
				rows: [
					{name: "android-installLocation", label: "Install Location", content: ["internalOnly", "preferExternal", "auto"], defaultValue: "internalOnly", type: "PickerRow"},
					{name: "android-minSdkVersion", label: "Minimum SDK", content: "7", defaultValue: "7", type: "InputRow"},
					{name: "android-maxSdkVersion", label: "Maximum SDK", content: "22", defaultValue: "22", type: "InputRow"},
					{name: "splash-screen-duration", label: "Splash screen Duration", content: "3000", defaultValue: "3000", type: "InputRow"},
					{name: "load-url-timeout", label: "Load URL timeout", content: "6000", defaultValue: "6000", type: "InputRow"},
					{name: "icon", label: "Icon", content: "", defaultValue: "", type: "AndroidImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", type: "AndroidImgRow"}
				]				
			}, 
			{
				id: "ios",
				name: "Apple iOS",
				rows: [
					{name: "webviewbounce", label: "Web view bounce", content:  ["true", "false"], defaultValue: "true", type: "PickerRow"},
					{name: "prerendered-icon", label: "Prerendred icon", content: ["true", "false"], defaultValue: "false", type: "PickerRow"},
					{name: "ios-statusbarstyle", label: "Status Bar style", content: ["black-opaque", "black-translucent", "default"], defaultValue: "black-opaque",  type: "PickerRow"},
					{name: "detect-data-types", label: "Detect Data type", content: ["true", "false"], defaultValue: "true", type: "PickerRow"},
					{name: "exit-on-suspend", label: "Exit on suspend", content: ["true", "false"], defaultValue: "false", type: "PickerRow"},
					{name: "show-splash-screen-spinner", label: "Show splash screen spinner", content: ["true", "false"], defaultValue: "false", type: "PickerRow"},
					{name: "auto-hide-splash-screen", label: "Auto-hide splash screen", content: ["true", "false"], defaultValue: "true", type: "PickerRow"},
					{name: "icon", label: "Icon", content: "", defaultValue: "", type: "IosImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", type: "IosImgRow"}
				]
			}, 
			{
				id: "winphone",
				name: "Microsoft Windows Phone 7",
				rows: [
					{name: "icon", label: "Icon", content: "", defaultValue: "", type: "WinphoneImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", type: "WinphoneImgRow"}
				]				
			}, 
			{
				id: "blackberry",
				name: "RIM Blackberry",
				rows: [
					{name: "disable-cursor", label: "Disable Cursor", content:  ["true", "false"], defaultValue: "false", type: "PickerRow"},
					{name: "icon", label: "Icon", content: "", defaultValue: "", type: "BlackBerryImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", type: "BlackBerryImgRow"}
				]
			}, 
			{
				id: "webos",
				name: "HP webOS 2",
				rows: [
					{name: "icon", label: "Icon", content: "", defaultValue: "", type: "WebOsImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", type: "WebOsImgRow"}
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
	commonDrawers: Phonegap.UIConfiguration.commonDrawersContent,

	/**
	 * @type {Array}
	 */
	platformDrawers: Phonegap.UIConfiguration.platformDrawersContent, 

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.createAllDrawers();	
	},

	createAllDrawers: function () {
		var self = this;
		createCommonDrawers(this.commonDrawers);
		createPlatformDrawers(this.platformDrawers);

		/**
		 * Create and initialise the content of all the common drawers which containe 
		 * parameters shared with all the platforms presented by
		 * Phonegap build.	
		 * @param  {Arary} inDrawers defined in the array {Phonegap.UIConfiguration.commonDrawersContent}
		 * @private
		 */
		function createCommonDrawers(inDrawers) {
			enyo.forEach(inDrawers, function (commonDrawer) {
				createCommonDrawer(commonDrawer);

				// get the last created drawer.
				var allDrawers = self.$.targetsRows.getComponents();
				var lastDrawer = allDrawers[allDrawers.length - 1];

				// A loop to Setup the content of each drawer.
				enyo.forEach(Phonegap.UIConfiguration.commonDrawersContent, function (drawerContent) {
					if (drawerContent.id === commonDrawer.id) {
						setUpDrawer(lastDrawer, drawerContent);
					}
				}, self);
			}, self);
		}

	
		/**
		 * Create and initialise the content of all the platforms drawers which containe 
		 * parameters of a specific platform presented by Phonegap build.	
		 * @param  {Arary} inDrawers defined in the array {Phonegap.UIConfiguration.platformDrawersContent}
		 * @private
		 */
		function createPlatformDrawers(inDrawers) {
			enyo.forEach(inDrawers, function (inDrawer) {
				createPlatformDrawer(inDrawer);

				// get the last created drawer.
				var allDrawers = self.$.targetsRows.getComponents();
				var lastDrawer = allDrawers[allDrawers.length - 1];
		
				// A loop to Setup the content of each drawer.
				enyo.forEach(Phonegap.UIConfiguration.platformDrawersContent, function (drawerContent) {
					if (drawerContent.id === inDrawer.id) {
						setUpDrawer(lastDrawer, drawerContent);
					}
				}, self);
			}, self);
		}

		/**
		 * Create one common drawer
		 * @param  {Array} inDrawer defined in the array {Phonegap.UIConfiguration.commonDrawersContent}
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
		 * @param  {Array} inDrawer defined in the array {Phonegap.UIConfiguration.platformDrawersContent}
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
		 * {Phonegap.UIConfiguration.drawerContent}
		 *
		 * @param {Object} dwr        The drawer to fill
		 * @param {Array} dwrContent list of the rows that will be placed in the drawer
		 * @private
		 */

		function setUpDrawer(dwr, dwrContent) {
			// Creation of the pickers of the drawer if they existe.
			enyo.forEach(dwrContent.rows, function (row) {
				dwr.$.drawer.createComponent({
					kind: "Phonegap.ProjectProperties." + row.type,
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
		this.trace("config:", this.config);		
		this.config.enabled = true;
		this.$.pgConfId.setValue(config.appId || '');
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
		this.trace("config:", this.config);	
		return this.config;
	},
	/**
	 * @protected
	 */
	refresh: function (inSender, inValue) {		
		this.trace("sender:", inSender, "value:", inValue);		
		var provider = Phonegap.ProjectProperties.getProvider();
		provider.authorize(enyo.bind(this, this.loadKeys));
	},

	/**
	 * @protected
	 */
	configure: function (inSender, inValue) {		
		this.trace("sender:", inSender, "value:", inValue);		
		this.doConfigure({
			id: 'phonegap'
		});
	},
	/**
	 * Event handler that detect the changes done in a drawer's row
	 * @param  {Object} inSender     contain the description of the envent sender
	 * @param  {function} saveProperty  this function is defined in each row's kind, it save the 
	 *                                  new input of the row in the object "this.config".
	 * 
	 * @private
	 */
	saveConfig: function(inSender, saveProperty)  {
		saveProperty.call(this, this.config) ;
		return true; //stop the bubbling
	}, 

	/**
	 * @protected
	 */
	loadKeys: function (err) {
	
		this.trace("err:", err);
	
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.targetNameChanged();
	},
	setProjectConfig: function (config) {
		
		this.trace("id:", this.targetId, "config:", config);
		
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
		
		this.trace("id:", this.targetId, "config:", this.config);
		
		return this.config;
	},
	/**
	 * @private
	 */
	targetNameChanged: function (old) {
		
		this.trace(old, "->", this.enabled);
		
		this.$.targetLbl.setContent(this.targetName);
	},
	/**
	 * @private
	 */
	enabledChanged: function (old) {
		
		this.trace("id:", this.targetId, old, "->", this.enabled);
		
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
			
			this.trace("id:", this.targetId);
			

			if (this.$.drawer.$.keySelector) {
				this.$.drawer.$.keySelector.destroy();
			}

			var keys = provider.getKey(this.targetId);
			
			this.trace("id:", this.targetId, "keys:", keys);
			
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
/**
 * Define the drawers "general" and "permissions"
 */
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
		ares.setupTraceLogger(this);
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
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.keysChanged();
		this.activeKeyIdChanged();
	},
	/**
	 * @private
	 */
	keysChanged: function (old) {
		
		this.trace("id:", this.targetId, old, "->", this.keys);
		
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
		
		this.trace("id:", this.targetId, old, "->", this.activeKeyId, "key:", key);
		
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
		this.trace("sender:", inSender, "value:", inValue);
		enyo.forEach(this.keys, function (key) {
			if (key.title === inValue.content) {
				this.setActiveKeyId(key.id);
				this.trace("selected key:", key);
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
		this.trace("sender:", inSender, "value:", inValue);		
		var key = this.getShowingKey();		
		this.trace("targetId:", this.targetId, "key:", key);		
		this.provider.setKey(this.targetId, key);
	}
});
