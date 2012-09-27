enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
	    {kind: "ProjectList", onCreateProject: "createProjectAction", onOpenProject: "openProjectAction", onProjectSelected: "showSelectedProject", name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia", providerListNeeded: false},
		{kind: "ProjectWizardPopup", canGenerate: false, name: "projectWizardPopup"},
		{kind: "ServiceRegistry", onServicesChange: "handleServicesChange"},
		
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
		this.listServices();
	},
	showErrorPopup : function(msg) {		// TODO Should refine error notification for the whole Ares project - ENYO-1105
		this.$.errorMsg.setContent(msg);
		this.$.errorPopup.show();
	},
	hideErrorPopup : function() {
		this.$.errorPopup.hide();
	},
	listServices: function() {
		this.$.serviceRegistry.listServices();
	},
	handleServicesChange: function(inSender, inServices) {	// TODO We should have only one ServiceRegistry for the whole Ares application - ENYO-1106
		this.services = inServices || [];
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

    	var service = inEvent.service;
    	var serviceId = inEvent.serviceId;
    	
		// super hack
		var auth = service ? service.auth : null;
		var url = service ? service.url : null;
		var jsonp = service ? service.useJsonp : false;

		var serviceInfo = {
			auth: auth,
			url: url,
			jsonp: jsonp
		};
    	
    	// Add an entry into the project list
    	this.$.projectList.addProject(inEvent.name, inEvent.folderId, serviceId);
    	
    	// Pass service information to Harmonia
		this.$.harmonia.setConfig({service: serviceInfo, folderId: inEvent.folderId, firstNodeName: inEvent.name});
		return true; //Stop event propagation
    },
    showSelectedProject: function(inSender, inEvent) {
    	if (inEvent.serviceId) {
	    	// Resolve serviceId
	    	var serviceInfo = this.resolveServiceId(inEvent.serviceId);
	    	if (! serviceInfo) {
	    		var msg = "Service " + inEvent.serviceId + " not found";
	    		this.showErrorPopup(msg);
	    		this.error(msg);
	    		return;
	    	}
	    	// Pass service information to HermesFileTree
			this.$.harmonia.setConfig({service: serviceInfo, folderId: inEvent.folderId, firstNodeName: inEvent.name});
    	}
		return true; //Stop event propagation
    },
    resolveServiceId: function(serviceId) {
    	for(var idx = 0; idx < this.services.length; idx++) {
    		var service = this.services[idx];
    		if (serviceId === service.id) {
    			return service; 
    		}
    	}
    	return undefined;
    }
});
