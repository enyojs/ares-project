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
		onConfirmConfigProject: "confirmConfigProject",
		onUploadProjectConfig: "uploadProjectConfig",
		onCancelSettings: "cancelSettings",
	},
	create: function() {
		this.inherited(arguments);
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
	confirmConfigProject: function(inSender, inEvent) {
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
	uploadProjectConfig: function(inSender, inEvent) {
		// push project data to project list
		this.$.projectList.storeProjectConfig(inEvent.name, inEvent.properties);
		this.$.projectPropertiesPopup.enableSettings(inEvent.properties);
		this.$.projectPropertiesPopup.show();
		// handled here (don't bubble)
		return true;
	},
	modifySettingsAction: function(inSender, inEvent) {
		this.$.projectPropertiesPopup.show();
		return true; 
	},
	cancelSettings: function(inSender, inEvent) {
	    this.$.projectPropertiesPopup.hide();
	    // handled here (don't bubble)
        return true;
	}
});
