/* global ares, Phonegap, ServiceRegistry */
/**
 * UI: Phonegap pane in the ProjectProperties popup
 * @name Phonegap.ProjectProperties
 */
enyo.kind({
	name: "Phonegap.ProjectProperties",
	kind: "Ares.ProjectProperties",
	debug: false,
	published: {
		config: {},
		project: undefined
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
						{name: "phonegapBuildHelp", kind: "onyx.TooltipDecorator", components: [
							{name: "phonegapBuildButton", kind: "onyx.IconButton", src: "$services/assets/images/Phonegap_build_help.png", ontap: "phonegapBuildClick"},
							{kind: "onyx.Tooltip", content: $L("PhoneGap Build Help")}
						]}, 
						{
							classes: "ares-row ares-align-left",
							name: "appIdRow",
							components: [
								{kind: "Phonegap.ProjectProperties.AppId", name: "appIdSelector"}							
							]
						}, 
						{name: "BuildOptionPanel", kind: "FittableRows", style: "margin-top: 50px;"},
						{kind: "Signals", "plugin.phonegap.userDataRefreshed": "refresh"},
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

	phonegapBuildHelpBrowser: null,

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.$.appIdSelector.setProject(this.project);
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
					pan: containerPanel,
					description: row.description
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

	/** 
	 * Called when the "Project Properties" Pop-up is opened.
	 * 
	 * @param {JSON} config contains the parametres & values of the provider "phonegap"
	 * @public
	 *
	 */
	setProjectConfig: function (config) {
		this.trace("Project config:", config);
		this.setConfig(config);
		this.$.appIdSelector.setSelectedAppId(config.appId || '');
		this.$.appIdSelector.setProject(this.project);
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

	/** 
	 * Called when the "Project Properties" Pop-up is saved.
	 * 
	 * @param {JSON} config contains the parametres & values of the provider "phonegap"
	 * @public
	 *
	 */
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

		//Send the request to get the user data only if the Phonegap build service is enabled.
		if (this.config && this.config.enabled) {
			provider.authorize(enyo.bind(this, this.getUserData));
		}		
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

	/** @private */
	phonegapBuildClick: function(){
		if (this.phonegapBuildHelpBrowser && !this.phonegapBuildHelpBrowser.closed) {
			this.phonegapBuildHelpBrowser.focus();
			return;
		}
		this.phonegapBuildHelpBrowser = window.open("https://build.phonegap.com/docs",
			"PhoneGap Build help",
			"resizable=yes, dependent=yes, width=800, height=600");
	},
	
	statics: {
		packageExtensions: {
			"android": "apk",
			"ios": "ipa",
			"webos": "ipk",
			"winphone": "xap",
			"blackberry": "jad"
		},
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
		this.setConfig(config);
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
		selectedTitle: undefined,
		project: undefined
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
	/**
	 *	Update this kind's attribut from the passed parameter.
	 * 
	 * @param {Object} config contains Phonegap build parmameters set in project.json
	 * @public
	 */
	setProjectConfig: function (config) {
		this.trace("id:", this.targetId, "config:", config);

		this.setEnabled( config && config.targets[this.targetId] );
		enyo.forEach(enyo.keys(this.$.drawer.$) , function (row) {
			if(this.$.drawer.$[row].platform){
				this.$.drawer.$[row].setProjectConfig(config);
			}
		}, this);


	},
	/**
	 * Update the object config using the attributes values of {Phonegap.ProjectProperties.Target}
	 * 
	 * @param  {Object} config contains Phonegap build parmameters set in project.json
	 * @public
	 */
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
					config.targets[this.targetId].keyTitle = this.$.drawer.$.signingKey.getActiveKeyTitle();
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


