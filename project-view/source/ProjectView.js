enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
	    {kind: "ProjectList", onCreateProject: "createProjectAction", onOpenProject: "openProjectAction", onProjectRemoved: "projectRemoved", onProjectSelected: "handleProjectSelected", name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia", providerListNeeded: false},
		{kind: "ProjectWizardPopup", canGenerate: false, name: "projectWizardPopup"},
		{name: "errorPopup", kind: "onyx.Popup", modal: true, centered: true, floating: true, components: [
		    {tag: "h3", content: "An error occured"},
		    {name: "errorMsg", content: "unknown error"},
		    {kind : "onyx.Button", content : "OK", ontap : "hideErrorPopup"}
		]},
    ],
	handlers: {
		onCancel: "cancelCreateProject",
		onConfirmCreateProject: "confirmCreateProject"
	},
	create: function() {
		this.inherited(arguments);
	},
	showErrorPopup : function(msg) {		// TODO Should refine error notification for the whole Ares project - ENYO-1105
		this.$.errorMsg.setContent(msg);
		this.$.errorPopup.show();
	},
	hideErrorPopup : function() {
		this.$.errorPopup.hide();
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
		return true; //Stop event propagation
	},
	projectRemoved: function(inSender, inEvent) {
    		this.$.harmonia.setProject(null);
	}
});
