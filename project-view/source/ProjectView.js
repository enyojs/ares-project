enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
	    {kind: "ProjectList", onCreateProject: "createProjectAction", onOpenProject: "openProjectAction", onProjectRemoved: "projectRemoved", onProjectSelected: "handleProjectSelected", name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia", providerListNeeded: false},
		{kind: "ProjectWizardPopup", canGenerate: false, name: "projectWizardPopup"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{kind: "ProjectConfig", name: "projectConfig"},
    ],
	handlers: {
		onCancel: "cancelCreateProject",
		onConfirmCreateProject: "confirmCreateProject",
		onConfirmConfigProject: "confirmConfigProject",
		onUploadProjectConfig: "uploadProjectConfig",
		onPhonegapBuild: "startPhonegapBuild"
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
	},
	startPhonegapBuild: function(inSender, inEvent) {
		var formData = new FormData();

		// formData.append('username', 'johndoe');
		// formData.append('id', 123456);
		// var file = new File();
		var b = new Blob(['enyo.depends(\n"$lib/layout",\n"$lib/onyx",\n"source"\n);'],
			{type: "application/octet-stream"});
		formData.append('file', b, 'package.js');

		var b = new Blob(['enyo.depends("App.js");'],
			{type: "application/octet-stream"});
		formData.append('file', b, 'source/package.js');

		var b = new Blob(['enyo.kind("App.js");'],
			{type: "application/octet-stream"});
		formData.append('file', b, 'source/App.js');

		var xhr = new XMLHttpRequest();
		xhr.open('POST', 'http://127.0.0.1:9029/build', true);
		xhr.onload = function(e) {
			enyo.log("form data onload: ", xhr);
		};

		xhr.send(formData);
	},
});
