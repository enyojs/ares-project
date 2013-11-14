/* jshint indent: false */ // TODO: ENYO-3311
/* global ares, ProjectConfig */

/**
 * This kind provide a widget to tune project properties
 *
 * By default, this widget is tuned for project modification.  In case
 * of project *creation*, the method setupCreate must be called after
 * construction. Since the widget is re-used between call for creation
 * or modification, the methos setupModif must be called also.
 */

enyo.kind({
	name: "ProjectProperties",
	debug: false,
	classes: "enyo-unselectable ares-classic-popup",
	fit: true,
	events: {
		onError: "",
		onModifiedConfig: "",
		onSaveGeneratedXml: "",
		onDone: "",
		onSelectFile: "",
		onCheckPath: "",
		onFileChoosersChecked: ""
	},
	handlers: {
		onAddSource: "addNewSource",
		onRemoveSource: "removeAddedSource",
		onInitSource: "initAddedSource",
		onInputButtonTap: "selectInputFile",
		onDisableOkButton: "disableOkButton",
		onEnableOkButton: "enableOkButton"
	},
	components: [
		{classes:"title left-align", content:"Project properties", components:[
			{kind: "onyx.RadioGroup", onActivate: "switchDrawers", name: "thumbnail", classes:"ares-radio-group", components: [
				{serviceId: "project", active: true, attributes: { title: $L("project attributes...") }, components: [
					{classes: "large-fixed", content: $L("Project")}, {tag: "span", classes:"ares-bottom-check"}
				]},
				{serviceId: "preview", attributes: { title: $L("project preview parameters...") }, components: [
					{classes: "large-fixed", content: $L("Preview")}, {tag:"span", classes:"ares-bottom-check"}
				]}
			]}
		]},
		{name: "projectDrawer", kind: "onyx.Drawer", open: true, components: [		
			{classes: "ares-project-properties",components:[
				{kind: "FittableRows", components: [
					{kind: "FittableColumns", classes: "ares-row", components: [
						{components: [
							{tag: "label", name: "projectPathLabel", classes : "ares-label", content: ""},
						]},
						{fit: true, components: [
							{tag: "label", name: "projectPathValue", classes : "ares-label", content: ""},
						]}
					]}
				]},
				{tag: "p", classes:"break"},
				{kind: "FittableColumns", components: [
					{kind: "FittableRows", components: [
						{classes: "ares-row", components: [
							{tag: "label", classes : "ares-fixed-label ares-small-label", content: $L("Name: ")},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", defaultFocus: true, name: "projectName"}
							]}
						]},
						{classes: "ares-row", components: [
							{tag: "label", classes : "ares-fixed-label ares-small-label", content: $L("Version: ")},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", defaultFocus: true, name: "projectVersion", placeholder:"0.0.1"}
							]}
						]},
						{classes: "ares-row", components: [
							{tag: "label", classes : "ares-fixed-label ares-small-label", content: $L("Author name: ")},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", name: "projectAuthor", attributes: {title: $L("Vendor / Committer Name")}, placeholder: $L("My Company")}
							]}
						]},
						{classes:"ares-row", name: "templatesEntry", showing: false, components: [
							{tag: "label", classes :"ares-fixed-label ares-small-label", content: $L("Template:")},
							{kind: "onyx.PickerDecorator", fit: true, components: [
								{name: "templateButton", classes:"very-large-width", kind: "onyx.PickerButton", fit: true},
								{kind: "onyx.FlyweightPicker", name: "templatePicker", components: [
									{name: "template"}
								], onSetupItem: "templateSetupItem", onSelect: "templateSelected"}
							]}
						]}
					]},
					{kind: "FittableRows", components: [
						{classes: "ares-row", components: [
							{tag: "label", classes: "ares-fixed-label ares-small-label", content: $L("Title: ")},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", defaultFocus: true, name: "projectTitle", placeholder: $L("My Example App")}
							]}
						]},
						{classes: "ares-row", components: [
							{tag: "label", classes : "ares-fixed-label ares-small-label", content: $L("Id: ")},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", defaultFocus: true, name: "projectId",
								attributes: {title: $L("Application ID in reverse domain-name format: com.example.apps.myapp")}, placeholder: "com.example.apps.myapp"}
							]}
						]},
						{classes: "ares-row", components: [
							{tag: "label", classes : "ares-fixed-label ares-small-label", content: $L("Contact: ")},
							{kind: "onyx.InputDecorator", components: [
								{kind: "Input", name: "projectContact",
									attributes: {title: $L("mail address or home page of the author")}, placeholder: $L("support@example.com")
								}
							]}
						]}
					]}
				]},
				{tag: "p", classes: "break"},
				{kind: "FittableColumns", components: [
					{classes: "ares-row", components: [
							{tag: "label", classes: "ares-fixed-label  ares-small-label", content: $L("Description:")},
							{kind: "onyx.InputDecorator", classes: "ares-project-properties-textarea-wide", components: [
								{kind: "onyx.TextArea", name: "projectDescription", fit: true, content: "", placeholder: $L("My project description...")}
							]}
						]}
				]},
				{tag:"p", classes:"break"},
				{kind: "enyo.FittableColumns", classes: "ares-row", name: "servicesList"}
			]}
		]},
		{name: "previewDrawer", kind: "onyx.Drawer", open: false, components: [
			{classes: "ares-project-properties", components:[
				{kind: "FittableRows", components: [
					{kind: "ProjectProperties.PathInputRow", 
						name: "topFileRow", 
						label: $L("Top application file: "), 
						inputTip: $L("top file of your application. Typically '/index.html', but per default '/debug.html' for debug mode."), 
						buttonTip: $L("select file...")}
				]}
			]}
		]},
		{name: "toolbarId", kind: "onyx.Toolbar", classes: "bottom-toolbar", components: [
			{kind: "onyx.Button", content: $L("Cancel"), ontap: "doDone"},
			{name: "ok", kind: "onyx.Button", content: $L("OK"), classes: "right", ontap: "confirmTap"}
		]},

		{kind: "Signals", onServicesChange: "handleServicesChange"}
	],
	published: {		
		topFileStatus: "",
		targetProject: "",
		validatePhonegapUiValues: {}
	},

	templates: [],
	TEMPLATE_NONE: "NONE",
	selectedTemplate: undefined,
	selectedAddedSource: undefined,
	services: {},
	addedSource:[],
	fileChoosers: [],
	
	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		this.validatePhonegapUiValues = {
			"sharedConfiguration-icon": true, "sharedConfiguration-splashScreen": true, 
			"splash-screen-duration": true, "load-url-timeout": true,
			"android-minSdkVersion": true, "android-maxSdkVersion": true,
			"ios-icon": true, "ios-splashScreen": true,
			"winphone-icon": true, "winphone-splashScreen": true,
			"blackberry-icon": true, "blackberry-splashScreen": true,
			"webos-icon": true, "webos-splashScreen": true

		};
	},
	/**
	 * Set the default tab
	 */
	
	setDefaultTab: function() {
		this.$.thumbnail.children[0].setActive(true);
	},

	setDisplayedTab: function(inIndex) {
		this.$.thumbnail.children[inIndex].setActive(true);
	},
	
	/**
	 * Receive the {onServicesChange} broadcast notification
	 * @param {Object} inEvent.serviceRegistry
	 */
	handleServicesChange: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);

		this.services = enyo.clone(this.services) || {};
		inEvent.serviceRegistry.forEach(enyo.bind(this, function(inService) {
			var service = {
				id: inService.id,
				name: inService.getName() || inService.id,
				kind: inService.getProjectPropertiesKind && inService.getProjectPropertiesKind()
			};
			this.trace("service:", service);
			if (service.kind) {
				this.services[service.id] = service;
			}
		}));
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			var service = this.services[serviceId];
			var drawer = this.$[service.id + 'Drawer'] || this.createComponent({
				name: service.id + 'Drawer',
				kind: "onyx.Drawer",
				open: false
			},{
				addBefore: this.$.toolbarId
			});
			service.panel = drawer.$[service.id] || drawer.createComponent({
				name: service.id,
				kind: service.kind
			});
			service.tab = this.$.thumbnail.$[service.id + 'Tab'] || this.$.thumbnail.createComponent({
				name: service.id + 'Tab',
				serviceId: service.id,
				showing: false,
				components:[{content:service.name, classes:"large-fixed"},{tag:"span", classes:"ares-bottom-check"}]
			});
			var frame = this.$.servicesList.$[service.id + 'Frame'];
			if (typeof frame !== 'object') {
				frame = this.$.servicesList.createComponent({
					name: service.id + 'Frame'
				});
				frame.createComponent({
					kind: 'onyx.Checkbox',
					name: service.id + 'CheckBox',
					onchange: 'toggleService',
					serviceId: service.id
				}, {
					owner: this
				});
				frame.createComponent({
					tag: 'label',
					classes: 'ares-label',
					content: service.name
				});
			}
			service.checkBox = this.$[service.id + 'CheckBox'];

			// Take the project configuration into account
			// to show the service or not
			this.showService(serviceId);


		}, this);
		this.trace("services:", this.services);
	},
	/**
	 * Toggle a service panel
	 */
	toggleService: function(inSender, inEvent) {
		var serviceId = inEvent.originator.serviceId,
		    checked = inEvent.originator.checked;
		this.trace("serviceId:", serviceId, 'checked:', checked);
		this.config.providers[serviceId].enabled = checked;
		this.showService(serviceId);
	},
	/**
	 * Tune the widget for project creation
	 */
	setupCreate: function() {
		//this.$.ok.setDisabled(true) ;
		this.$.templatesEntry.show();
		this.notifyProjectPropertyStatus({status: "create"});
	},

	/**
	 * Tune the widget for project modification
	 */
	setupModif: function() {
		//Set the selected Project Information to plugin service drawer
		for(var serviceId in this.services){
			var service = this.services[serviceId];
			var serviceDrawer = this.$[service.id + 'Drawer'].$[service.id];
			if(typeof serviceDrawer.setTargetProject === 'function'){
				serviceDrawer.setTargetProject(this.targetProject);
			}
		}
		this.$.templatesEntry.hide();
		this.notifyProjectPropertyStatus({status: "modify"});
	},

	/**
	 * close one drawer and open the other depending on which radio button was tapped
	 */
	switchDrawers: function(inSender, inEvent) {
		if (inEvent.originator.active === true ) {
			enyo.forEach(inEvent.originator.parent.children, function(tab) {
				var activate = (tab.serviceId === inEvent.originator.serviceId);
				this.$[tab.serviceId + 'Drawer'].setOpen(activate);
			}, this);
		}
	},

	/**
	 * Show the drawer of the corresponding service.
	 */
	showServiceDrawer: function(inServiceId) {
		this.$.thumbnail.$[inServiceId + "Tab"].setActive(true);
	},

	/**
	 * pre-fill the widget with configuration data
	 * @param {Object} config is configuration data (typically from project.json)
	 *  can be a json string or an object.
	 */
	preFill: function(inData) {
		var conf = typeof inData === 'object' ? inData : enyo.json.parse(inData);
		this.config = ProjectConfig.checkConfig(conf);

		// avoid storing 'undefined' in there
		this.$.projectId.setValue(this.config.id || '' );
		this.$.projectVersion.setValue(this.config.version || '' );
		this.$.projectName.setValue(this.config.name || '' );
		this.$.projectTitle.setValue(this.config.title || '' );

		if (!this.config.author) {
			this.config.author = {};
		}
		this.$.projectAuthor.setValue(this.config.author.name || '') ;
		this.$.projectContact.setValue(this.config.author.href || '') ;

		this.$.projectDescription.setValue(this.config.description || '') ;

		// Load each provider service configuration into its
		// respective ProjectProperties panel
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			this.showService(serviceId);
		}, this);

		if (!this.config.preview) {
			this.config.preview = {};
		}

		this.$.topFileRow.setValue(this.config.preview.top_file);

		return this ;
	},

	update: function(inData) {
		var conf = this.config ;

		enyo.forEach(enyo.keys(inData), function(key) {
			conf[key] = inData[key];
		});
		this.$.projectId.     setValue(conf.id      || '' );
		this.$.projectVersion.setValue(conf.version || '' );
		this.$.projectTitle.  setValue(conf.title   || '' );

		return this ;
	},

	showService: function(serviceId) {
		var service = this.services[serviceId];
		var config = this.config && this.config.providers && this.config.providers[serviceId];
		var enabled = config && config.enabled;
		service.checkBox.setChecked(enabled);
		service.tab.setShowing(enabled);
		if (config) {
			service.panel.setProjectConfig(config);
		}
	},

	notifyProjectPropertyStatus: function(inEvent) {
		this.waterfallDown("onChangeProjectStatus", inEvent);
	},

	/** @private */
	confirmTap: function(inSender, inEvent) {
		// retrieve all configuration settings
		this.config = {};

		// Project settings
		this.config.id = this.$.projectId.getValue();
		this.config.version = this.$.projectVersion.getValue();
		this.config.name = this.$.projectName.getValue();
		this.config.title = this.$.projectTitle.getValue();

		this.config.author = {};
		this.config.author.name = this.$.projectAuthor.getValue();
		this.config.author.href = this.$.projectContact.getValue();

		this.config.description = this.$.projectDescription.getValue();		

		// Preview settings
		this.config.preview = {};
		this.config.preview.top_file = this.$.topFileRow.getValue();

		// Dump each provider service configuration panel into
		// the project configuration.
		this.config.providers = {};
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			var service = this.services[serviceId];
			this.config.providers[service.id] = {};
			this.config.providers[service.id].enabled = service.checkBox.checked;

			if ((service.checkBox.checked) && (service.panel.getDefaultConfig !== undefined)) {
				var webosConfigID = service.panel.getDefaultConfig();
				if (webosConfigID !== undefined) {
					this.addNewSource(null, {source: webosConfigID});
				}
			}

			service.panel.saveProjectConfig(this.targetProject);
			service.panel.getProjectConfig(this.config.providers[service.id]);
		}, this);

		if(this.config.name === ""){
			this.doError({msg:"Please enter a valid Name value.", title:"User Error"});
			return;
		}else if(this.config.title === ""){
			this.doError({msg: "Please enter a valid Title value." , title:"User Error"});
			return;
		}else if(this.config.version === ""){
			this.doError({msg: "Please enter a valid Version value.", title:"User Error"});
			return;
		}else if(this.config.id === ""){
			this.doError( {msg: "Please enter a valid Id value.", title: "User Error"});
			return;
		}
		
		this.doModifiedConfig({data: this.config, template: this.selectedTemplate, addedSources: this.addedSource}) ;

		this.doDone();

		if (inEvent.callBack) {
			inEvent.callBack() ;
		}

		// handled here (don't bubble)
		return true;
	},
	
	disableOkButton: function(inSender, inEvent) {

		this.$.ok.setDisabled(true);
		this.validatePhonegapUiValues[this.defineValidationArrayKey(inEvent.originator)] = false;
	},


	/**
	 * @private
	 * Function to define the name of the element of the array {this.validatePhonegapUiValues}
	 * to be marked as correct.
	 * 
	 * @param  {Object} inOriginator to object that fired the event.
	 * @return {String} corresponding name of the key of the array {this.validatePhonegapUiValues}
	 */
	defineValidationArrayKey: function(inOriginator) {
		if (inOriginator.name === "icon") {
				return inOriginator && inOriginator.platform + "-icon";
			} else {
				if (inOriginator.name === "splashScreen") {
					return inOriginator && inOriginator.platform + "-splashScreen";
				}
				else {
					return inOriginator.name;
				}
			}
	},

	/**
	 * Enable the OK button of the project properties Pop-up if all the values are 
	 * correct.
	 * Called if the event onEnableOkButton is fired by a row in Phonegap build UI
	 * This event is bubbled in the case where the value set in the UI Row is corrected.	 * 
	 * 
	 * @param  {Object} inSender container of the originator of the event
	 * @param  {Object} inEvent  contain the new state of the event originator
	 * @return {boolean}         stop the bubbling.
	 */
	enableOkButton: function(inSender, inEvent){		

		// Set in the array {this.validatePhonegapUiValues} the originator UI row as valide
		this.validatePhonegapUiValues[this.defineValidationArrayKey(inEvent.originator)] = true;
	
		var okDisabled = false;
	
		// Reevaluate all the array {this.validatePhonegapUiValues} in order to enable the 
		// button OK if all the array's elements have the value true.
		for(var key in this.validatePhonegapUiValues) {
			if (this.validatePhonegapUiValues[key] === false) {
				okDisabled = true;	
			}
		}

		this.$.ok.setDisabled(okDisabled);		
	},

	/** @public */
	setTemplateList: function(templates) {
		this.templates = [this.TEMPLATE_NONE];
		enyo.forEach(templates, function(item) {
			// TODO: also keep track of the template description
			this.templates.push(item.id);
		}, this);
		this.$.templatePicker.setCount(this.templates.length);
		this.$.templatePicker.setSelected(0);
		this.selectedTemplate = undefined;
	},
	/** @public */
	setLibsList: function(inLibs) {
		this.libs = this.libs || [];
		enyo.forEach(inLibs, function(inLib) {
			inLib = enyo.filter(this.libs, function(lib) {
				return inLib.id !== lib.id;
			})[0];
			if (inLib) {
				// new lib
				this.libs.push(inLib.id);
				this.$.libsChecker.createComponent({
					kind: "ProjectProperties.LibCheckBox",
					name: inLib.id + "Checker",
					lib: inLib
				}, {
					onLibChecked: "_onLibCheckedAction",
					owner: this
				});
			}
		}, this);

	},
	_onLibCheckedAction: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
		var selectedLibs = [];
		enyo.forEach(this.libs, function(lib) {
			if (lib.id === inEvent.lib.id) {
				lib.selected = inEvent.checked;
			}
			if (lib.selected) {
				selectedLibs.push(lib.id);
			}
		}, this);
		this.setSelectedLibs(selectedLibs);
	},
	templateSetupItem: function(inSender, inEvent) {
		this.$.template.setContent(this.templates[inEvent.index]);
		return true;
	},
	templateSelected: function(inSender, inEvent) {
		if (inEvent.content === this.TEMPLATE_NONE) {
			this.selectedTemplate = undefined;
		} else {
			this.selectedTemplate = inEvent.content;
		}
	},
	topFileChanged: function() {
		this.$.topFileRow.setValue(this.topFile);
	},
	topFileStatusChanged: function() {
		this.$.topFileRow.setStatus(this.topFileStatus);
	},
	handleAdditionalSource: function(inSender, inEvent) {
		this.selectedAddedSource = inEvent.source;
		return true;
	},
	addNewSource: function(inSender, inEvent) {
		this.addedSource.push(inEvent.source);
		return true;
	},
	removeAddedSource: function(inSender, inEvent) {
		var index = this.addedSource.indexOf(inEvent.source);
		this.addedSource = this.addedSource.slice(0,index).concat(this.addedSource.slice(index+1,this.addedSource.lenght));
		return true;
	},
	initAddedSource: function(inSender, inEvent) {
		this.addedSource = [];
		return true;
	},
	/** @public */
	activateFileChoosers: function(status) {
		this.$.topFileRow.setActivated(status);

		// Activate PhoneGap (and other services) path chooser buttons in related rows
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			if (serviceId === "phonegap") {
				this.services[serviceId].panel.activateInputRows(status);
			}

			/* to the same for further services to be intregrated in Project Properties*/ 
		}, this);
	},
	/** @public */
	checkFileChoosers: function() {
		this.fileChoosers = [];

		// get fileChooser triggering objects name for ares project properties
		// currently only one: Top File's PathInputRow in Preview tab
		for (var o in this.$) {
			if (this.$[o].kind === "ProjectProperties.PathInputRow") {
				this.fileChoosers.push(this.$[o]);
			}
		}
		
		// find PhoneGap (and other services) rows containing path chooser buttons
		enyo.forEach(enyo.keys(this.services), function(serviceId) {
			if (serviceId === "phonegap") {
				this.fileChoosers = this.fileChoosers.concat(this.services[serviceId].panel.findAllInputRows());
			}
			
			/* to the same for further services to be intregrated in Project Properties*/ 
		}, this);
		
		var chooser = this.fileChoosers.shift();
		this.doCheckPath({input: chooser, value: chooser.getValue()});	
	},
	/** @private */
	fileChooserChecked: function() {
		if (this.fileChoosers.length) {
			var chooser = this.fileChoosers.shift();
			this.doCheckPath({input: chooser, value: chooser.getValue()});
		} else {
			this.doFileChoosersChecked();
		}

		return true;
	},
	/** @private */
	selectInputFile: function (inSender, inData) {
		this.doSelectFile({input: inData.originator, value: inData.originator.getValue(), status: inData.originator.getStatus(), header: inData.header});
	},
	/** @public */
	updateFileInput: function(input, value) {
		input.setValue(value);
		return true;
	},
	updatePathCheck: function(input, status) {
		input.setStatus(status);
		this.fileChooserChecked();
		return true;
	}
});

enyo.kind({
	name: "ProjectProperties.LibCheckBox",
	classes: "ares-row",
	published: {
		lib: ""
	},
	events: {
		onLibChecked: ""
	},
	components: [
		{name: "chkBx", kind: "onyx.Checkbox", onchange: "onCheckedAction"},
		{tag:"label", classes:"ares-label", content: ""}
	],
	onCheckedAction: function(inSender, inEvent) {
		this.doLibChecked({
			lib: this.lib,
			use: this.$.chkBx.checked
		});
		return true;
	}
});

enyo.kind({
	name: "ProjectProperties.PathInputRow",
	classes: "ares-row",
	published: {
		label: "",
		value: "",
		inputTip: "",
		activated: false,
		status: false,
		buttonTip: ""
	},
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	components: [
		{tag: "label", name: "pathInputLabel", classes:"ares-fixed-label"},
		{kind: "onyx.InputDecorator", components: [
			{kind: "Input", name: "pathInputValue", disabled: true}
		]},
		{kind: "onyx.IconButton", name:"pathInputButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"}
	],
	debug: false,

	create: function () {
		this.inherited(arguments);

		this.labelChanged();
		this.valueChanged();
		this.inputTipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttonTipChanged();
	},
	/** @private */
	labelChanged: function () {
		this.$.pathInputLabel.setContent(this.label);
	},
	/** @private */
	valueChanged: function () {
		this.$.pathInputValue.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputTipChanged: function () {
		this.$.pathInputValue.setAttribute("title", this.inputTip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.pathInputButton.show();
			this.statusChanged();
		} else {
			this.$.pathInputButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.pathInputButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.pathInputButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttonTipChanged: function () {
		this.$.pathInputButton.setAttribute("title", this.buttonTip);
	},
	/** @private */
	pathInputTap: function (inSender, inEvent) {
		this.doInputButtonTap({header: $L("Select top file...")});
		return true;
	}
});
