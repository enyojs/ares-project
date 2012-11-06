enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
		{kind: "ProjectList",
			onModifySettings: "modifySettingsAction",
			onCreateProject: "createProjectAction",
			onImportProject: "importProjectAction",
			onProjectRemoved: "projectRemoved",
			onProjectSelected: "handleProjectSelected",
			name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia", providerListNeeded: false},
		{kind: "ProjectWizardCreate", canGenerate: false, name: "projectWizardCreate"},
		{kind: "ProjectWizardImport", canGenerate: false, name: "projectWizardImport"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{kind: "ProjectConfig", name: "projectConfig"}
		{kind: "PhonegapBuild"},
		{kind: "ProjectPropertiesPopup", name: "projectPropertiesPopup"}
    ],
	handlers: {
		onConfirmCreateProject: "confirmCreateProject",
		onConfirmConfigProject: "setupConfigProject",
		onInitConfigProject: "initConfigProject",
		onCustomConfigProject: "customConfigProject",
		onFinishProjectConfig: "finishConfigProject",
		onCancelSettings: "cancelSettings",
		onSaveGeneratedXml: "saveGeneratedXml",
		onPhonegapBuild: "startPhonegapBuild"
	},
	serviceFs: null,
	create: function() {
		this.inherited(arguments);
		serviceFs = [];
	},
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},
	importProjectAction: function(inSender, inEvent) {
    	this.$.projectWizardImport.reset().show();
        return true; //Stop event propagation
    },
    createProjectAction: function(inSender, inEvent) {
    	this.$.projectWizardCreate.reset().show();
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
	startPhonegapBuild: function(inSender, inEvent) {
		this.$.phonegapBuild.startPhonegapBuild(this.currentProject);
	}
});
