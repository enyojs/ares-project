enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
		{kind: "ProjectList",
			onModifySettings: "modifySettingsAction",
			onCreateProject: "createProjectAction",
			onScanProject: "scanProjectAction",
			onProjectRemoved: "projectRemoved",
			onProjectSelected: "handleProjectSelected",
			name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia", providerListNeeded: false},
		{kind: "ProjectWizardCreate", canGenerate: false, name: "projectWizardCreate"},
		{kind: "ProjectWizardScan", canGenerate: false, name: "projectWizardScan"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{kind: "ProjectConfig", name: "projectConfig"},
		{kind: "PhonegapBuild"},
		{kind: "ProjectPropertiesPopup", name: "projectPropertiesPopup"},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{kind: "Image", src: "$phobos/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
			{name: "waitPopupMessage", content: "Ongoing...", style: "padding-top: 10px;"}
		]}
	],
	handlers: {
		onConfirmCreateProject: "confirmCreateProject",
		onConfirmConfigProject: "setupConfigProject",
		onInitConfigProject: "initConfigProject",
		onCustomConfigProject: "customConfigProject",
		onFinishProjectConfig: "finishConfigProject",
		onCancelSettings: "cancelSettings",
		onSaveGeneratedXml: "saveGeneratedXml",
		onPhonegapBuild: "startPhonegapBuild",
		onBuildStarted: "phonegapBuildStarted",
		onError: "showErrorMsg"
	},
	serviceFs: null,
	create: function() {
		this.inherited(arguments);
		serviceFs = [];
	},
	showErrorMsg: function(inSender, inEvent) {
		this.log(inEvent);
		this.hideWaitPopup();
		this.showErrorPopup(inEvent.msg);
		return true; //Stop event propagation
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	scanProjectAction: function(inSender, inEvent) {
		this.$.projectWizardScan.setHeaderText('Select a directory containing one or mode project.json');
		this.$.projectWizardScan.show();
		return true; //Stop event propagation
	},
	createProjectAction: function(inSender, inEvent) {
		this.$.projectWizardCreate.start();
		return true; //Stop event propagation
	},
	confirmCreateProject: function(inSender, inEvent) {
		try {
			// Add an entry into the project list
			this.$.projectList.addProject(inEvent.name, inEvent.folderId, inEvent.service);
		} catch(e) {
				var msg = e.toString();
				this.showErrorPopup(msg);
				this.error(msg);
				return false;
		}
		return true; //Stop event propagation
	},
	handleProjectSelected: function(inSender, inEvent) {
		// Pass service definition & configuration to Harmonia
		// & consequently to HermesFileTree
		this.$.harmonia.setProject(inEvent.project);
		this.$.projectConfig.checkConfig(inEvent.project);
		// Keep one reference on service FS implementation
		serviceFs = inEvent.project.service.impl;
		this.currentProject = inEvent.project;
		return true; //Stop event propagation
	},
	projectRemoved: function(inSender, inEvent) {
		this.$.harmonia.setProject(null);
	},
	setupConfigProject: function(inSender, inEvent) {
		try {
			// data to create the project properties file
			var projectData = {
					name: inEvent.name,
					folderId: inEvent.folderId,
					service: inEvent.service
			};
			this.$.projectConfig.createConfig(projectData)
				.response(this, function() {
					// Pass service information to Harmonia
					// *once* project.json has been created
					this.$.harmonia.setProject(projectData);
				}) ;
		} catch(e) {
			this.showErrorPopup(e.toString());
			return false;
		}
		// handled here (don't bubble)
		return true;
	},
	initConfigProject: function(inSender, inEvent) {
		// push project data in project list
		this.$.projectList.storeBaseConfigProject(inEvent.name, inEvent.folderId, inEvent.properties);
		// pre-filled and customized projectPropertiesPopup fields
		this.$.projectPropertiesPopup.preFillConfig(inEvent.properties);
	},
	customConfigProject: function(inSender, inEvent) {
		// retrieve data modified  and store into projectConfig on FS
		this.$.projectList.storeCustomConfigProject(inEvent);
	},
	finishConfigProject: function(inSender, inEvent) {
		// customized project data will be stored on FS into project.json
		this.$.projectConfig.fsUpdateFile(inEvent);
		// reset the popup settings
		this.$.projectPropertiesPopup.reset();
		this.$.projectPropertiesPopup.hide();
		// generate the config.xml file
		this.$.projectPropertiesPopup.generateConfigXML(inEvent);
	},
	modifySettingsAction: function(inSender, inEvent) {
		// projectProperties popup - onTap action
		this.$.projectPropertiesPopup.show();
		// handled here (don't bubble)
		return true;
	},
	cancelSettings: function(inSender, inEvent) {
		// projectProperties popup - cancel action
		this.$.projectPropertiesPopup.hide();
		// handled here (don't bubble)
		return true;
	},
	saveGeneratedXml: function(inEvent, inSender) {
		// TODO: MADBH - need to discuss with FiX and Yves
		// config.xml needs to saved/stored under a target/phonegapbuild directory
		var configXmlData = {
			folderId: inSender.folderId,
			xmlFile: inSender.configXML,
			service: serviceFs,
		};
		this.$.projectConfig.storeXml(configXmlData);
		// handled here (don't bubble)
		return true;
	},
	showWaitPopup: function(inMessage) {
		this.$.waitPopupMessage.setContent(inMessage);
		this.$.waitPopup.show();
	},
	hideWaitPopup: function() {
		this.$.waitPopup.hide();
	},
	startPhonegapBuild: function(inSender, inEvent) {
		var credentials = {	username: "xxxx", password: "yyyy"};	// TOOD TBR
		this.showWaitPopup("Starting phonegap build");
		this.$.phonegapBuild.startPhonegapBuild(this.currentProject, credentials);
	},
	phonegapBuildStarted: function(inSender, inEvent) {
		this.showWaitPopup("Phonegap build started");
		setTimeout(enyo.bind(this, "hideWaitPopup"), 2000);
	}
});
