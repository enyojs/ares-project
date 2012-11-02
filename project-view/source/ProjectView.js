enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
	    {kind: "ProjectList", onCreateProject: "createProjectAction", onImportProject: "importProjectAction", onProjectRemoved: "projectRemoved", onProjectSelected: "handleProjectSelected", name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia", providerListNeeded: false},
		{kind: "ProjectWizardCreate", canGenerate: false, name: "projectWizardCreate"},
		{kind: "ProjectWizardImport", canGenerate: false, name: "projectWizardImport"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{kind: "ProjectConfig", name: "projectConfig"}
    ],
	handlers: {
		onConfirmCreateProject: "confirmCreateProject",
		onConfirmConfigProject: "confirmConfigProject",
		onUploadProjectConfig: "uploadProjectConfig"
	},
	create: function() {
		this.inherited(arguments);
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
	uploadProjectConfig: function(inSender, inEvent) {
		// push project data to project list
		this.$.projectList.storeProjectConfig(inEvent.name, inEvent.properties);
	}
});
