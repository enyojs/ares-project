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
 * -- defaultHeight: the default icon/splash screen height
 * -- defaultWidth: the default icon/splash screen Width
 * -- type: contain the last part of the name of the kind that will be used to define a row, these kinds are defined in
 *          the "PhonegapUIRows.js"
 * -- jsonSection: a subsection of "providers.phonegap" in the file "project.json"
 * @type {String}
 */
enyo.kind({
	name: "Phonegap.UIConfiguration",
	statics: {

		commonDrawersContent: [
			{
				id: "buildOption",
				name: "Build Options",
				type: "Drawer",
				rows: [
					{name: "autoGenerateXML", label: "Generate config.xml file when building", content: "", defaultValue: "true", type: "BuildOption"},
					{name: "minification", label:"Activate the build minification", content:"", defaultValue: "true", type: "BuildOption"}
				]
			},
			{
				id: "sharedConfiguration",
				name: "Shared configuration",
				type: "Drawer",
				rows: [
					{
						name: "phonegap-version",
						label:"Phonegap version",
						content:["2.9.0", "2.7.0", "2.5.0", "2.3.0", "2.2.0", "2.1.0", "2.0.0"],
						defaultValue: "2.9.0",
						type: "PickerRow", jsonSection: "preferences"
					},
					{name: "orientation", label:"Orientation",content:["both", "landscape", "portrait"], defaultValue: "both", type: "PickerRow", jsonSection: "preferences"},
					{name: "target-device",	label: "Target device", content: ["universal", "handset", "tablet"], defaultValue: "universal", type: "PickerRow", jsonSection: "preferences"},
					{name: "fullscreen", label: "Fullscreen mode", content: ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},					
					{name: "access", label: "Access origin", content: "", defaultValue: "http://127.0.0.1", type: "AccessRow", jsonSection: "preferences"},
					{name: "icon", label: "Icon", content: "icon.png", defaultValue: "/icon.png", defaultWidth: "32", defaultHeight: "32", type: "ImgRow"},
					{name: "splashScreen", label: "SplashScreen", content: "", defaultValue: "", defaultWidth: "60", defaultHeight: "60", type: "ImgRow"}
				]		
			}, 
			{
				id: "applicationPermissions",
				name: "Application permissions",
				type: "Drawer",
				rows: [
					{name: "battery", label: "Battery",	content: "",defaultValue: "",  type: "CheckBoxRow", jsonSection: "features"},
					{name: "camera", label: "Camera", content: "",defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "contact", label: "Contact",	content: "",defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "file", label: "File", content: "",defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "media",	label: "Media", content: "",defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "geolocation", label: "Geolocation", content: "", defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "network", label: "Network", content: "",defaultValue: "",  type: "CheckBoxRow", jsonSection: "features"},
					{name: "notification", label: "Notification", content: "", defaultValue: "", type: "CheckBoxRow", jsonSection: "features"},
					{name: "device", label: "Device", content: "", defaultValue: "",  type: "CheckBoxRow", jsonSection: "features"}
				]
			}
		],

		platformDrawersContent: [
			{
				id: "android",
				name: "Google Android",
				type: "Target",
				rows: [
					{name: "android-installLocation", label: "Install Location", content: ["internalOnly", "preferExternal", "auto"], defaultValue: "internalOnly", type: "PickerRow", jsonSection: "preferences"},
					{name: "android-minSdkVersion", label: "Minimum SDK", content: "7", defaultValue: "7", type: "InputRow", jsonSection: "preferences"},
					{name: "android-maxSdkVersion", label: "Maximum SDK", content: "", defaultValue: "", type: "InputRow", jsonSection: "preferences"},
					{name: "splash-screen-duration", label: "Splash screen Duration", content: "5000", defaultValue: "5000", type: "InputRow", jsonSection: "preferences"},
					{name: "load-url-timeout", label: "Load URL timeout", content: "20000", defaultValue: "20000", type: "InputRow", jsonSection: "preferences"},
					{name: "icon", label: "Icon", content: "", defaultValue: "/icon.png", type: "AndroidImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", type: "AndroidImgRow"},
					{name: "signingKey", label: "Signing Key", content: "", defaultValue: "", type: "KeySelector", jsonSection: "targets"}
				]				
			}, 
			{
				id: "ios",
				name: "Apple iOS",
				type: "Target",
				rows: [
					{name: "webviewbounce", label: "Web view bounce", content:  ["true", "false"], defaultValue: "true", type: "PickerRow", jsonSection: "preferences"},
					{name: "prerendered-icon", label: "Prerendred icon", content: ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "ios-statusbarstyle", label: "Status Bar style", content: ["black-opaque", "black-translucent", "default"], defaultValue: "black-opaque",  type: "PickerRow", jsonSection: "preferences"},
					{name: "detect-data-types", label: "Detect Data type", content: ["true", "false"], defaultValue: "true", type: "PickerRow", jsonSection: "preferences"},
					{name: "exit-on-suspend", label: "Exit on suspend", content: ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "show-splash-screen-spinner", label: "Show splash screen spinner", content: ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "auto-hide-splash-screen", label: "Auto-hide splash screen", content: ["true", "false"], defaultValue: "true", type: "PickerRow", jsonSection: "preferences"},
					{name: "icon", label: "Icon", content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow"},
					{name: "signingKey", label: "Signing Key", content: "", defaultValue: "", type: "KeySelector", jsonSection: "targets"}
				]
			},  
			{
				id: "blackberry",
				name: "RIM Blackberry",
				type: "Target",
				rows: [
					{name: "disable-cursor", label: "Disable Cursor", content:  ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "icon", label: "Icon", content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow"},
					{name: "signingKey", label: "Signing Key", content: "", defaultValue: "", type: "KeySelector", jsonSection: "targets"}
				]
			}, 
			{
				id: "webos",
				name: "HP webOS 2",
				type: "Target",
				rows: [
					{name: "icon", label: "Icon", content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow"}
				]
			},
			{
				id: "winphone",
				name: "Microsoft Windows Phone 7",
				type: "Target",
				rows: [
					{name: "icon", label: "Icon", content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow"}
				]				
			},
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
		onError: "",
		onConfigure: ""
	},
	components: [{
			kind: "enyo.Scroller",
			fit: "true",
			classes: "ares-project-properties",
			components: [{
					kind: "FittableRows",
					components: [
						{content: "Sign-in is required", name: "signInErrorMsg", classes: "ares-project-properties-sign-in-msg"}, 
						{content: "Looking for Phonegap account data ...", name: "waitingForSignIn", classes: "ares-project-properties-sign-in-msg"},
						{
							classes: "ares-row ares-align-left",
							name: "appIdRow",
							components: [
								{kind: "Phonegap.ProjectProperties.AppId", name: "appIdSelector"}							
							]
						}, 
						{name: "BuildOptionPanel", kind: "FittableRows", style: "margin-top: 50px;"},
						{name: "targetsRows", kind: "FittableRows", classes: "ares-project-properties-targetsRows-display"}
						
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
			
		/**
		 * Create a drawer in the UI "Phonegap Build" without initilizing its content.
		 * 
		 * @param  {Phonegap.ProjectProperties.Drawer} or {Phonegap.ProjectProperties.target}  inDrawer container for the rows.
		 * @private
		 */
		function createDrawer(inDrawer) {			
			var container;
			
			if (inDrawer.id === 'buildOption'){
				container = this.$.BuildOptionPanel;
			} else {
				container = this.$.targetsRows;			
			}

			container.createComponent({
				name: inDrawer.id,
				classes: "ares-row",
				kind: "Phonegap.ProjectProperties." + inDrawer.type,
				targetId: inDrawer.id,
				drawerName: inDrawer.name,
				enabled: false
			});	
	}

		/**
		 * Create all the drawers in in the UI "Phonegap Build".
		 * 
		 * @param  {Array} inDrawers Array declared in {Phonegap.UIConfiguration}.
		 * @private
		 */
		function createDrawers(inDrawers) {			
			enyo.forEach(inDrawers, function (inDrawer) {				
				createDrawer.call(this, inDrawer);								
			}, this);
		}

		/**
		 * Initialise the content of a drawer.
		 * @param {Phonegap.ProjectProperties.Drawer} or {Phonegap.ProjectProperties.target} dwr container for the rows.
		 * @param {Array} dwrContent Array declared in {Phonegap.UIConfiguration}.
		 */
		function initialiseDrawer(dwr, dwrContent) {
			var getPanel = function (inRowName){
				if (inRowName === "autoGenerateXML") {					
					return this.$.targetsRows;
				}
			};
									
			enyo.forEach(dwrContent.rows, function (row) {
		
				var containerPanel = getPanel.call(this, row.name);
			
				dwr.$.drawer.createComponent({
					kind: "Phonegap.ProjectProperties." + row.type,
					name: row.name,
					label: row.label,
					contentValue: row.content,	
					value: row.defaultValue,
					jsonSection: row.jsonSection,
					platform: dwrContent.id,
					width: row.defaultWidth,
					height: row.defaultHeight,
					pan: containerPanel
				});
			}, this);
		}

		/**
		 * Initialise all the drawers in in the UI "Phonegap Build".
		 * 
		 * @param  {Array} inDrawers Array declared in {Phonegap.UIConfiguration}
		 * @private
		 */
		function initialiseDrawers(inDrawers) {		
			var i = 0;			
			enyo.forEach(inDrawers, function (inDrawer) {
				
				// get all the created drawers.
				var allDrawers = this.$.BuildOptionPanel.getComponents().concat(this.$.targetsRows.getComponents());
				
				// get the current drawer to fill
				var actualDrawer = allDrawers[i];
				
				//increment to the next drawer
				i ++;				

				// A loop to Setup the content of each drawer.
				enyo.forEach(this.commonDrawers.concat(this.platformDrawers), function (drawerContent) {
					if (drawerContent.id === inDrawer.id) {
						initialiseDrawer.call(this, actualDrawer, drawerContent);
					}
				}, this);
			}, this);
		}

		createDrawers.call(this, this.commonDrawers.concat(this.platformDrawers));
		initialiseDrawers.call(this, this.commonDrawers.concat(this.platformDrawers));
	},

	/** @public */
	setProjectConfig: function (config) {
		this.trace("Project config:", config);

		config.enabled = true;	
		this.$.appIdSelector.setSelectedAppId(config.appId || '');		
		config.targets = config.targets || {};


		enyo.forEach(this.commonDrawers.concat(this.platformDrawers), function (drawer) {
			if (drawer.id === 'buildOption') {
				this.$.BuildOptionPanel.$[drawer.id].setProjectConfig(config);
			} else {
				this.$.targetsRows.$[drawer.id].setProjectConfig(config);
			}
			
		}, this);

		this.refresh();
	},

	/** @public */
	getProjectConfig: function (config) {
		config.access = {};
		config.features = {};
		config.preferences = {};
		config.icon = {};
		config.splashScreen = {};
		config.targets = {};

		config.appId = this.$.appIdSelector.getSelectedAppId();
		
		enyo.forEach(this.commonDrawers.concat(this.platformDrawers), function (drawer) {
			if (drawer.id !== "applicationPermissions" && drawer.id !== "buildOption") {
				config.icon[drawer.id] = {};
				config.splashScreen[drawer.id] = {};
			}
			if(drawer.id === 'buildOption'){
				this.$.BuildOptionPanel.$[drawer.id].getProjectConfig(config);
			} else {
				this.$.targetsRows.$[drawer.id].getProjectConfig(config);
			}
			
		}, this);

		this.trace("Project config:", config);
	},
	/**
	 * @protected
	 */
	refresh: function (inSender, inValue) {
		this.trace("sender:", inSender, "value:", inValue);		
		var provider = Phonegap.ProjectProperties.getProvider();		
		this.showErrorMsg("waitingSignIn");
		provider.authorize(enyo.bind(this, this.getUserData));
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
	 * Display the content of the top row in the Phonegap Build panel according 
	 * to the Phonegap authentification status.
	 * 
	 * @param  {String} authStatus can have as a value [userDataRecieved, signInError, waitingSignIn]
	 * @private.
	 */
	showErrorMsg: function(authStatus) {
		
		if(authStatus === "userDataRecieved") {
			this.$.appIdRow.show();
			this.$.signInErrorMsg.hide();
			this.$.waitingForSignIn.hide();
		} else{
			 if (authStatus === "signInError") {
						this.$.signInErrorMsg.show();
						this.$.appIdRow.hide();
						this.$.waitingForSignIn.hide();
			} else if (authStatus === "waitingSignIn"){
				this.$.signInErrorMsg.hide();
				this.$.appIdRow.hide();
				this.$.waitingForSignIn.show();

			} 
		}		
	},

	/**
	 * @protected
	 */
	getUserData: function (err, userData) {

		if (err) {
			//this.warn("err:", err);
			this.showErrorMsg("signInError");
			this.doError({msg: err.toString(), err: err});
		} else {			
			this.showErrorMsg("userDataRecieved");
			var provider = Phonegap.ProjectProperties.getProvider();
									
			enyo.forEach(this.platformDrawers, function (target) {
				this.$.appIdSelector.setUserData(userData);
				var keys = provider.getKey(target.id);
				if(target.id === "android" || target.id === "ios"|| target.id === "blackberry") {
					this.$.targetsRows.$[target.id].$.drawer.$.signingKey.setKeys(keys);
				}
								
			}, this);
		}
	},
	/** @public */
	activateInputRows: function (status) {
		var fileChoosers = this.findAllInputRows();
		enyo.forEach(fileChoosers, function (fileChooser) {
			fileChooser.setActivated(status);
		}, this);
	},
	/** @public */
	findAllInputRows: function () {
		var fileChoosers = [],
			drawers = this.$.targetsRows;
		
		enyo.forEach(enyo.keys(drawers.$), function (drawer) {
			var targets = drawers.$[drawer],
				rows = targets.$.drawer;
			enyo.forEach(enyo.keys(rows.$), function (row) {
				if (rows.$[row].name === 'icon') {
					fileChoosers.push(rows.$[row]);
				} else if (rows.$[row].name === 'splashScreen') {
					fileChoosers.push(rows.$[row]);
				}
			}, this);
		}, this);

		return fileChoosers;
	},

	statics: {
		getProvider: function () {
			this.provider = this.provider || ServiceRegistry.instance.resolveServiceId('phonegap');
			return this.provider;
		}
	}
});

/**
 * Define the drawers "sharedConfiguration" and "applicationPermissions"
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
	 * @private
	 */
	drawerNameChanged: function () {
		this.$.drawerLbl.setContent(this.drawerName);
	},

	setProjectConfig: function (config) {
		
		enyo.forEach(enyo.keys(this.$.drawer.$) , function (row) {
			if (row === "client" || row === "animator") {
				// nop;
			} else {
				this.$.drawer.$[row].setProjectConfig(config);
			}
		}, this);
	},

	getProjectConfig: function (config) {		
		enyo.forEach(enyo.keys(this.$.drawer.$) , function (row) {			
			if (row === "client" || row === "animator") {
				// nop;
			} else {				
				this.$.drawer.$[row].getProjectConfig(config);
			}
		}, this);
	},

	/**
	 * Fold/Unfold the content of a drawer.
	 * @private
	 */
	unfold: function () {
		this.$.drawer.setOpen(this.fold);
		this.fold = !this.fold;
	}
});


enyo.kind({
	name: "Phonegap.ProjectProperties.AppId",
	kind: "FittableRows",
	classes: "ares-project-propertie-application-panel",
	debug: false,
	published: {
		userData: undefined,
		selectedAppId: undefined,
		selectedTitle: undefined
	},

	components: [
	{
		kind:"FittableColumns",
		classes: "ares-project-properties-appid-container",
		components: [
			{content: "Title",	classes: "ares-project-properties-appid-label-title"},
			{name: "ApplicationTitle"}
		]
	},
	{
		kind:"FittableColumns",				
		components: [
			{content: "AppId",	classes: "ares-project-properties-appid-label-title"},
			{
				kind: "onyx.PickerDecorator",			
				components: [
					{kind: "onyx.PickerButton", classes: "ares-project-properties-picker", content:"Select AppId"},
					{kind: "onyx.Picker", name: "AppIdList", onSelect: "updateSelectedAppId"}
				]
			},
			{kind:"Phonegap.ProjectProperties.BuildStatus", name: "buildStatusDisplay"}
			
		]
	}
		
	],

	/**@private*/
	userDataChanged: function(){
		
		this.clearPickerContent();		
		
		//object containing default application's data to be associated with the picker's element "New Application"
		var newApplicationObject = {title: "", role: "owner", link: null};
				
		if (this.userData.user.apps.all.length === 0){
			this.$.AppIdList.createComponent({content: "New Application", published: {applicationObject: newApplicationObject}, active: true});
			this.setSelectedAppId('');
		} else {
			this.$.AppIdList.createComponent({content: "New Application", published: {applicationObject: newApplicationObject}, active: false});
			enyo.forEach(this.userData.user.apps.all, 
				function (inApp) {
					var itemState = inApp.id === this.selectedAppId ? true : false;
					if (itemState) {
						this.setSelectedTitle(inApp.title);
					}					
					this.$.AppIdList.createComponent({content: inApp.id, published: {applicationObject: inApp} , active: itemState});			
					this.$.AppIdList.render();								
				}, this);
		}		
	}, 

	/**@private*/
	updateSelectedAppId: function (inSender, inValue) {		
	
		/**
		 * selectedAppData is a sub-element from the object "userData" that contains the followin attributs : 
		 * id : appId
		 * link: url suffix for the Phonegap build application
		 * role: user's privilege on the selected application
		 * title: application's title.
		 * @type {Array}
		 */
		var selectedAppData = inValue && inValue.selected.published.applicationObject;
		
		this.setSelectedTitle(selectedAppData.title || "");
		this.$.buildStatusDisplay.$.statusMessage.setContent("");
		if (inValue.content === "New Application") {
			this.setSelectedAppId("");
		} else {
			this.setSelectedAppId(inValue.content);
		}				
	},
	selectedAppIdChanged: function() {
		this.$.buildStatusDisplay.setAppId(this.selectedAppId);		
	},

	/**@private*/
	clearPickerContent: function(){
		
		for (var key in this.$.AppIdList.$) {
					
			if (this.$.AppIdList.$[key].kind === "onyx.MenuItem"){							
				this.$.AppIdList.$[key].destroy();
			}		
		}
		this.$.AppIdList.render();
	},

	/**@private*/
	selectedTitleChanged: function(){
		this.$.ApplicationTitle.setContent(this.selectedTitle);
		this.$.ApplicationTitle.render();
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.PlatformBuildStatus",
	kind: "onyx.IconButton",
	classes: "ares-project-properties-build-status-icon",
	ontap: "showStatusMessage",	
	published: {
		platform: undefined,
		buildStatusData: undefined,
	},
	buildStatusDataChanged: function() {
		if (this.buildStatusData && this.buildStatusData.status[this.platform] === "complete") {
			//Build status: complete
			this.setSrc("$services/assets/images/platforms/" + this.platform + "-logo-complete-32x32.png");
			
		} else {
			if (this.buildStatusData && this.buildStatusData.status[this.platform] === "error" || 
			    this.buildStatusData && this.buildStatusData.status[this.platform] === null){
				
				//Build status: error				
				this.setSrc("$services/assets/images/platforms/" + this.platform + "-logo-error-32x32.png");

			} else {
				if(this.buildStatusData === null) {
					
					//Build status: application not built
					this.setSrc("$services/assets/images/platforms/" + this.platform + "-logo-not-available-32x32.png");

				} else {					
					//Build status: pending
					this.setSrc("$services/assets/images/platforms/" + this.platform + "-logo-not-available-32x32.png");

				}		
			}
		}
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.BuildStatus",
	kind: "FittableRows",
	published: {
		appId: "",
		buildStatusData: undefined,
		phongapUrl: "https://build.phonegap.com",
		provider: undefined 
	},
	components: [
		{
			name: "buildStatusContainer", kind: "FittableRows", classes: "ares-project-properties-build-status-container",
			components: [
				{	
					name: "labelContainer",
					classes:"ares-project-properties-buildStatus-container",
					kind: "FittableColumns",					
					components:[						
						{ name: "androidButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "android" },
						{ name: "iosButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "ios" },
						{ name: "blackberryButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "blackberry" },
						{ name: "webosButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform:"webos" },
						{ name: "winphoneButton", kind: "Phonegap.ProjectProperties.PlatformBuildStatus", platform: "winphone" }							
					]
				},
				{
					name: "messageContainer",
					kind: "onyx.Drawer",
					classes: "ares-project-properties-status-message-container",
					showing: false,
					components: [
						{name: "hideStatusContainer", kind: "onyx.IconButton", src: "$project-view/assets/images/close-button-16x16.png", classes: "ares-project-properties-hide-status-button", ontap:"hideMessageContainer"},
						{name: "statusMessage"},
						{name: "downloadLink", content: "ddl link", tag: "a", shown: false, classes: "ares-project-properties-dl-link"}
					]
				}
									
			]
		}
	],
	/**@private*/
	create: function() {
		this.inherited(arguments);		
		this.appIdChanged();
		this.setProvider(Phonegap.ProjectProperties.getProvider());
	},

	/**@private*/
	updateBuildStatusContainer: function(){
		
		if(this.appId === ""){
			this.setBuildStatusData(null);			
		} else {
			this.provider.getAppData(this.appId, enyo.bind(this, this.getBuildStatusData));
		} 

		this.buildStatusDataChanged();
		this.$.buildStatusContainer.render();
	},
	
	/**
	 * Charge the icon showing the build status of the application of a a given platform depending on 
	 * its status. the status is checked from the "buildStatusData" object.
	 * By clicking on the icon, the status message is displayed.
	 * @private	 
	 */
	buildStatusDataChanged: function(){
		this.hideMessageContainer();
		this.$.downloadLink.hide();
		for(var key in this.$){
			// Get only the Enyo control that have the "platform" attribute 
			// => {Phonegap.ProjectProperties.PlatformBuildStatus} instance
			if(this.$[key].platform !== undefined) {
				this.$[key].setBuildStatusData(this.buildStatusData);
			}			
		}
	},

	/**@private*/
	showStatusMessage: function(inSender, inEvent){
		var extensions = {
			"android": "apk",
			"ios": "ipa",
			"webos": "ipk",
			"winphone": "xap",
			"blackberry": "jad"
		};

		this.$.messageContainer.show();


		if (this.buildStatusData && this.buildStatusData.status[inSender.platform] === "complete") {
			this.$.statusMessage.setContent("Download link: ");
			
			if (this.buildStatusData.download[inSender.platform] !== undefined && 
				this.buildStatusData.title !== undefined) {
				
				this.$.downloadLink.setAttribute("href", this.phongapUrl + this.buildStatusData.download[inSender.platform]);
				this.$.downloadLink.setContent(this.buildStatusData.title + "." + extensions[inSender.platform]);
				this.$.downloadLink.show();
				this.$.downloadLink.render();
			} else {
				this.$.downloadLink.hide();
			}
		} else {
			if (this.buildStatusData && this.buildStatusData.status[inSender.platform] === "error" || 
				this.buildStatusData && this.buildStatusData.status[inSender.platform] === null){

				//Build status: error
				this.$.downloadLink.hide();
				this.$.statusMessage.setContent("Error: " + this.buildStatusData.error[inSender.platform]);				
			} else {
				
				if(this.buildStatusData === null) {
					
					//Build status: application not built
					this.$.downloadLink.hide();
					this.$.statusMessage.setContent("Build the application first");					

				} else {
					
					//Build status: pending
					this.$.downloadLink.hide();
					this.$.statusMessage.setContent("Build in progress");
				}		
			}
		}
	return true; //stop the propagation of the event

	},

	/**@private*/
	hideMessageContainer: function() {
		this.$.messageContainer.hide();
	},

	/**@private*/
	appIdChanged: function(){
		this.updateBuildStatusContainer();
	},

	/**
	 * Callback function to initialize the "buildStatusData" object. 
	 * 
	 * @param  {Object} err               error object
	 * @param  {Object} inBuildStatusData Object returned by Phonegap build, it contains several informations
	 *                                    about the built application.
	 * @private
	 */
	getBuildStatusData: function (err, inBuildStatusData) {
		if (err) {
			this.warn("err:", err);
		} else {
			this.setBuildStatusData(inBuildStatusData.user);
		}
	}
});

/**
 * This widget is aware of the differences between the Phoneap Build targets.
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.Target",
	kind: "Phonegap.ProjectProperties.Drawer",
	debug: false,
	classes: "ares-drawer",
	published: {
		targetId: "",		
		enabled: "",
		keys: {}
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
		this.drawerNameChanged();
	},
	/**@public*/
	setProjectConfig: function (config) {
		this.trace("id:", this.targetId, "config:", config);

		this.setEnabled( config && config.targets[this.targetId] );
		enyo.forEach(enyo.keys(this.$.drawer.$) , function (row) {
			if(this.$.drawer.$[row].platform){
				this.$.drawer.$[row].setProjectConfig(config);
			}
		}, this);


	},
	/**@public*/
	getProjectConfig: function (config) {
		if (this.enabled) {
			config.targets[this.targetId] = {};
		}

		enyo.forEach(enyo.keys(this.$.drawer.$) , function (row) {
			
			if (row === "client" || row === "animator") {
				// nop;
			} else if (row === "signingKey") {				
				if (this.enabled && this.$.drawer.$.signingKey.getActiveKeyId()) {
					config.targets[this.targetId].keyId = this.$.drawer.$.signingKey.getActiveKeyId();
				}
				
			} else {

				this.$.drawer.$[row].getProjectConfig(config);
			}
		}, this);
		this.trace("id:", this.targetId, "config:", config);
	},
	/**
	 * @private
	 */
	drawerNameChanged: function (old) {		
		this.trace(old, "->", this.enabled);		
		this.$.targetLbl.setContent(this.drawerName);
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
	 * @private
	 */
	updateDrawer: function () {		
		this.setEnabled(this.$.targetChkBx.checked);
	},
});


