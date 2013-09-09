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
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", type: "AndroidImgRow"}
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
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow"}
				]
			},  
			{
				id: "blackberry",
				name: "RIM Blackberry",
				type: "Target",
				rows: [
					{name: "disable-cursor", label: "Disable Cursor", content:  ["true", "false"], defaultValue: "false", type: "PickerRow", jsonSection: "preferences"},
					{name: "icon", label: "Icon", content: "", defaultValue: "/icon.png", defaultWidth:"", defaultHeight:"", type: "ImgRow"},
					{name: "splashScreen", label: "Splash screen", content: "", defaultValue: "", defaultWidth: "", defaultHeight: "", type: "ImgRow"}
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
						{name: "BuildOptionPanel", kind: "FittableRows"},
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
				this.$.targetsRows.$[target.id].loadKeys(provider);
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
					{kind: "onyx.PickerButton", classes: "ares-project-properties-picker"},
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
				
		if (this.userData.user.apps.all.length === 0){
			this.$.AppIdList.createComponent({content: "New Application", active: true});
			this.setSelectedAppId('');
		} else {
			this.$.AppIdList.createComponent({content: "New Application", active: false});
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
		this.setSelectedTitle(inValue && inValue.selected.published.applicationObject&& inValue.selected.published.applicationObject.title || "");
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
							{
								name: "androidButton", kind: "onyx.IconButton", platform: "android", src: "$services/assets/images/platforms/android-logo-not-available-32x32.png", classes: "ares-project-properties-build-status-icon",
								ontap: "showStatusMessage",
								components: [
									{name: "androidMessage", classes:"ares-hide", title: "", url: ""}
								]
							},
							{
								name: "iosButton", kind: "onyx.IconButton", platform: "ios", src: "$services/assets/images/platforms/ios-logo-not-available-32x32.png", classes: "ares-project-properties-build-status-icon",
								ontap: "showStatusMessage",
								components: [
									{name: "iosMessage", classes:"ares-hide", title: "", url: ""}
								]
							},
							{
								name: "blackberryButton", kind: "onyx.IconButton", platform: "blackberry", src: "$services/assets/images/platforms/blackberry-logo-not-available-32x32.png", classes: "ares-project-properties-build-status-icon",
								ontap: "showStatusMessage",
								components: [
									{name: "blackberryMessage", classes:"ares-hide", title: "", url: ""}
								]
							},
							{
								name: "webosButton", kind: "onyx.IconButton", platform: "webos", src: "$services/assets/images/platforms/webos-logo-not-available-32x32.png", classes: "ares-project-properties-build-status-icon",
								ontap: "showStatusMessage",
								components: [
									{name: "webosMessage", classes:"ares-hide", title: "", url: ""}
								]
							},
							{
								name: "winphoneButton", kind: "onyx.IconButton", platform: "winphone", src: "$services/assets/images/platforms/winphone-logo-not-available-32x32.png", classes: "ares-project-properties-build-status-icon",
								ontap: "showStatusMessage",
								components: [
									{name: "winphoneMessage", classes:"ares-hide", title: "", url: ""}
								]
							}
						]
				},
			
				{name: "statusMessage", /*onclick: "hideStatusMessage",*/ classes: "project-properties-status-message"},
				{name: "downloadLink", content: "ddl link", tag: "a"}
					
			]
		}
	],
	/**@private*/
	create: function() {
		this.inherited(arguments);
		this.$.downloadLink.hide();
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
	 * 
	 * @param  {onyx.IconButton} inIconButton Icon showing the status of the application build for a given
	 *                                        platform.
	 * @private
	 */
	buildStatusStyle: function(inIconButton) {

		var extensions = {
		    "android": "apk",
		    "ios": "ipa",
		    "webos": "ipk",
		    "winphone": "xap",
		    "blackberry": "jad"
	    };

		if (this.buildStatusData && this.buildStatusData.status[inIconButton.platform] === "complete") {
			
			//Build status: complete
			inIconButton.setSrc("$services/assets/images/platforms/"+inIconButton.platform + "-logo-complete-32x32.png");
			this.$[inIconButton.platform+"Message"].setContent("Download link: ");
				//save the title of the application + its extension
			this.$[inIconButton.platform+"Message"].title = this.buildStatusData.title + "." + extensions[inIconButton.platform];
				//save the URL to download the application
			this.$[inIconButton.platform+"Message"].url = this.phongapUrl + this.buildStatusData.download[inIconButton.platform];	
			} else {
			if (this.buildStatusData && this.buildStatusData.status[inIconButton.platform] === "error" || 
				this.buildStatusData && this.buildStatusData.status[inIconButton.platform] === null){
				
				//Build status: error
				inIconButton.setSrc("$services/assets/images/platforms/" + inIconButton.platform + "-logo-error-32x32.png");
				this.$[inIconButton.platform + "Message"].setContent("Error: " + this.buildStatusData.error[inIconButton.platform]);
				this.$[inIconButton.platform+"Message"].title = null;
				this.$[inIconButton.platform+"Message"].url = null;
			} else {
				
				inIconButton.setSrc("$services/assets/images/platforms/" + inIconButton.platform + "-logo-not-available-32x32.png");
				if(this.buildStatusData === null) {
					
					//Build status: application not built
					this.$[inIconButton.platform + "Message"].setContent("Build the application first");
					this.$[inIconButton.platform+"Message"].title = null;
					this.$[inIconButton.platform+"Message"].url = null;
				} else {
					
					//Build status: pending
					this.$[inIconButton.platform + "Message"].setContent("Build in progress");
				}		
			}
		}
	},

	/**
	 * Change the icon of the application status for all platforms.
	 * 
	 * @private	 
	 */
	buildStatusDataChanged: function(){	
		this.log(this.buildStatusData);
		for(var key in this.$){
			if(this.$[key].platform !== undefined) {
				this.buildStatusStyle(this.$[key]);
			}			
		}
	},

	/**@private*/
	showStatusMessage: function(inSender, inEvent){
		this.$.statusMessage.setContent(this.$[inSender.platform+"Message"].getContent());
		this.log(this.$[inSender.platform+"Message"]);
		if (this.$[inSender.platform+"Message"].url !== null && 
			this.$[inSender.platform+"Message"].title !== null) {

			this.log("in IF");
			this.$.downloadLink.setAttribute("href", this.$[inSender.platform+"Message"].url);
			this.$.downloadLink.setContent(this.$[inSender.platform+"Message"].title);
			this.$.downloadLink.show();
			this.$.downloadLink.render();
			this.log(this.$.downloadLink);
		} else {
			this.$.downloadLink.hide();
		}

	},

	/**
	 * Hide the status message.
	 * 
	 * @private
	 */
	hideStatusMessage: function(){
		//this.$.statusMessage.setContent("");
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
			if (row === "client" || row === "animator") {
				// nop;
			} else if (row === "keySelector") {
				if (this.enabled) {
					this.$.drawer.$.keySelector.setActiveKeyId( config.targets[this.targetId].keyId );
				}
			} else {
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
			} else if (row === "keySelector") {
				if (this.enabled && this.$.drawer.$.keySelector.getActiveKeyId()) {
					config.targets[this.targetId].keyId = this.$.drawer.$.keySelector.getActiveKeyId();
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
});

enyo.kind({
	name: "Phonegap.ProjectProperties.KeySelector",
	debug: false,
	kind: "FittableColumns",
	published: {
		targetId: "",
		keys: undefined,
		activeKeyId: undefined,
		provider: undefined
	},
	components: [	
		{classes: "ares-project-properties-drawer-row-label", content: "Signing Key"}, 
		{name: "noSigningKeys", content: "No signing keys for this platform"},
		{
			name: "signingKeysContainer",			
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
					kind: "onyx.InputDecorator", classes: "ares-project-properties-margin-right",
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
				{ kind: "onyx.Button", content: "Save",	ontap: "savePassword", classes: "ares-project-properties-margin-right"}				
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

		if(this.keys.length !== 0){

			this.$.signingKeysContainer.show();
			this.$.noSigningKeys.hide();

			// Fill
			enyo.forEach(this.keys, function (key) {
				this.$.keys.createComponent({
					name: key.id,
					content: key.title,
					active: (key.id === this.activeKeyId)
				});
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
