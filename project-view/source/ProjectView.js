enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
	    {kind: "ProjectList", 
	    	onModifySettings: "modifySettingsAction",
	    	onCreateProject: "createProjectAction", 
	    	onOpenProject: "openProjectAction", 
	    	onProjectRemoved: "projectRemoved", 
	    	onProjectSelected: "handleProjectSelected", 
	    	name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia", providerListNeeded: false},
		{kind: "ProjectWizardPopup", canGenerate: false, name: "projectWizardPopup"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{kind: "ProjectConfig", name: "projectConfig"},
		{kind: "ProjectPropertiesPopup", name: "projectPropertiesPopup"},
    ],
	handlers: {
		onCancel: "cancelCreateProject",
		onConfirmCreateProject: "confirmCreateProject",
		onConfirmConfigProject: "setupConfigProject",
		onInitConfigProject: "initConfigProject",
		onCustomConfigProject: "customConfigProject",
		onFinishProjectConfig: "finishConfigProject",
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
   openProjectAction: function(inSender, inEvent) {
    	this.$.projectWizardPopup.reset();
    	this.$.projectWizardPopup.setCreateMode(false);
        this.$.projectWizardPopup.show();
        return true; //Stop event propagation
    },
    createProjectAction: function(inSender, inEvent) {
    	this.$.projectWizardPopup.reset();
    	this.$.projectWizardPopup.setCreateMode(true);
        this.$.projectWizardPopup.show();
        return true; //Stop event propagation
    },
    cancelCreateProject: function(inSender, inEvent) {
        this.$.projectWizardPopup.hide();
        return true; //Stop event propagation
    },
	confirmCreateProject: function(inSender, inEvent) {
    		this.$.projectWizardPopup.hide();

		try {
			// keep an reference on serviceFs
			serviceFs = inEvent.service;
			//console.dir(serviceFs);
    		// Add an entry into the project list
    		this.$.projectList.addProject(inEvent.name, inEvent.folderId, inEvent.service);
    			
    		// Pass service information to Harmonia
			this.$.harmonia.setProject({
				service: inEvent.service,
				folderId: inEvent.folderId,
				name: inEvent.name
			});
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
			this.$.projectConfig.createConfig(projectData);
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
		this.$.projectPropertiesPopup.reset();
		this.$.projectPropertiesPopup.hide();
	},
	modifySettingsAction: function(inSender, inEvent) {
		// projectProperties popup - onTap action
		this.$.projectPropertiesPopup.show();
		// handled here (don't bubble)	
		return true; 
	}
});
