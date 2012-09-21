enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
	    {kind: "ProjectList", onCreateProject: "createProjectAction", },
		{kind: "HermesFileTree", fit:true, name: "hermesFileTree"},
		{kind: "ProjectWizardPopup", canGenerate: false, name: "projectWizardPopup"}
    ],
	handlers: {
		onCancel: "cancelCreateProject",
		onConfirmCreateProject: "confirmCreateProject"
	},
	create: function() {
		this.inherited(arguments);
	},
    createProjectAction: function(inSender, inEvent) {
        this.$.projectWizardPopup.show();
        return true; //Stop event propagation
    },
    cancelCreateProject: function(inSender, inEvent) {
        this.$.projectWizardPopup.hide();
        return true; //Stop event propagation
    },
    confirmCreateProject: function(inSender, inEvent) {
    	this.$.projectWizardPopup.hide();
        // TODO - Auto-generated code
    	this.log("LET'S GO ...");
    	console.dir(inEvent);
    	
    	var service = inEvent.selectedDir.service;
    	
		// super hack
		var auth = service ? service.auth : null;
		var url = service ? service.url : null;
		var jsonp = service ? service.useJsonp : false;

		//this.log("service: auth: "+auth+" url: "+url+" jsonp: "+jsonp);
		var serviceObj = {
			auth: auth,
			url: url,
			jsonp: jsonp
		};
		this.log("LET'S GO ... with: " + JSON.stringify(serviceObj));
		this.$.hermesFileTree.setServiceInformation(serviceObj);
		this.$.hermesFileTree.reset();
		return true; //Stop event propagation
    }
});

enyo.kind({
	name: "ProjectList",
	classes: "enyo-unselectable",
	style: "width: 300px",
	events: {
		onCreateProject: ""
	},
	handlers: {
	},
	components: [
	{kind: "onyx.Toolbar", isContainer: true, name: "toolbar", components: [
			{kind: "onyx.Button", content: "Create Project", ontap: "doCreateProject"},
			{kind: "onyx.Button", content: "Open Project", ontap: "doOpenProject"}
		]},
	{kind: "List", content: "list", controlParentName: "client", name: "projectList", onSetupItem: "projectListSetupItem", ontap: "projectListTap"}
]
,
    projectListSetupItem: function(inSender, inEvent) {
        // TODO - Auto-generated code
    },
    projectListTap: function(inSender, inEvent) {
        // TODO - Auto-generated code
    }
});

enyo.kind({
	name: "ProjectWizard",
	classes: "enyo-unselectable",
	events: {
		onCancel: "",
		onConfirmCreateProject: ""
	},
	handlers: {
		onDirectorySelected: "directorySelected"
	},
	components: [
	    {kind: "FittableRows", fit: true, name: "fittableRows", components: [
			{kind: "FittableColumns", name: "fittableColumns", components: [
					{kind: "Control", content: "Project name: ", name: "control"},
					{kind: "onyx.InputDecorator", content: "Project name", name: "inputDecorator", components: [
							{kind: "Input", placeholder: "Enter project name", name: "projectName"}
						]}
				]},
			{kind: "FittableColumns", name: "fittableColumns4", components: [
					{kind: "Control", content: "Directory:", name: "control5"},
					{kind: "onyx.InputDecorator", name: "inputDecorator2", components: [
							{kind: "Input", placeholder: "Enter text here", name: "projectDirectory"}
						]},
					{kind: "onyx.Button", content: "Browse", name: "browse", ontap: "browseTap"}
				]},
			{kind: "Control", fit: true, name: "control2"},
			{kind: "FittableColumns", style: "margin-top: 10px", name: "fittableColumns5", components: [
					{kind: "Control", fit: true, name: "control7"},
					{kind: "onyx.Button", content: "Cancel", name: "cancel", ontap: "cancelTap"},
					{kind: "onyx.Button", content: "OK", name: "confirm", ontap: "confirmTap"}
				]}
		]},
		{kind: "SelectServicePopup", canGenerate: false, name: "selectServicePopup"}		// TODO to rename
    ],
    // TODO Reset the projectName, ...
    browseTap: function(inSender, inEvent) {
        this.$.selectServicePopup.show();
    },
    cancelTap: function(inSender, inEvent) {
        this.doCancel();
    },
    confirmTap: function(inSender, inEvent) {
        this.doConfirmCreateProject({name: this.$.projectName.getValue(), selectedDir: this.selectedDir});
    },
    directorySelected: function(inSender, inEvent) {
    	this.selectedDir =inEvent;
    	this.log("YES");		
    	console.dir(this.selectedDir);
    	this.$.projectDirectory.setValue(this.selectedDir.id);
    	this.$.selectServicePopup.hide();
    }
});

enyo.kind({
	name: "ProjectWizardPopup",
	kind: "onyx.Popup",
	events: {
	},
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	classes: "ares_pview_popup",
	components: [
        {kind: "ProjectWizard"}
	]
});

enyo.kind({
	name : "ServiceSelector",
	kind : "enyo.FittableRows",
	style: "height: 400px; width: 600px",
	components : [
	    {kind: "FittableColumns", content: "fittableColumns", fit: true, name: "fittableColumns", components: [
			{kind: "ProviderList", name: "providerList", onSelectProvider: "selectProvider"},
			{kind: "HermesFileTree", fit: true, name: "hermesFileTree", onFileClick: "selectFile", onFolderClick: "selectFolder"}
		]},
	    {kind: "FittableColumns", content: "fittableColumns2", isContainer: true, name: "fittableColumns2", components: [
			{name: "selectedDir", fit: true, content: "Selected: "},
			{kind: "onyx.Button", content: "Cancel", ontap: "doCancel"},
			{kind: "onyx.Button", content: "OK", isContainer: true, name: "confirm", ontap: "confirmTap"}
		]}
    ],
	events: {
		onDirectorySelected: ""
	},
	selectedDir: undefined,
	selectProvider: function(inSender, inInfo) {
		this.log("In " + this.kind + " service='"+JSON.stringify(inInfo.service)+"'");

		// super hack
		var auth = inInfo.service ? inInfo.service.auth : null;
		var url = inInfo.service ? inInfo.service.url : null;
		var jsonp = inInfo.service ? inInfo.service.useJsonp : false;

		//this.log("service: auth: "+auth+" url: "+url+" jsonp: "+jsonp);
		var serviceObj = {
			auth: auth,
			url: url,
			jsonp: jsonp
		};
		this.$.hermesFileTree.setServiceInformation(serviceObj);
		this.$.hermesFileTree.reset();
		return true; //Stop event propagation
	},
	selectFile: function(inSender, inEvent) {
		console.log("In " + this.kind + " Selected file: "+inEvent.file.id);
		this.selectedDir = undefined;
		this.$.selectedDir.setContent("Selected: ");
		this.$.confirm.setDisabled(true);
		return true; // Stop event propagation
	},
	selectFolder: function(inSender, inEvent) {
		this.selectedDir = inEvent.file;
		console.log("In " + this.kind + " Selected folder: " + this.selectedDir);
		this.$.selectedDir.setContent("Selected: " + this.selectedDir.id);
		this.$.confirm.setDisabled(false);
		return true; // Stop event propagation
	},
    confirmTap: function(inSender, inEvent) {
        this.log(this.kind + ":confirmTap");
        console.dir(this.selectedDir);
        this.doDirectorySelected(this.selectedDir);
        return true; // Stop event propagation 
    }
,
    doCancel: function(inSender, inEvent) {
        // TODO - Auto-generated code
    }
});

enyo.kind({
	name: "SelectServicePopup",
	kind: "onyx.Popup",
	events: {
	},
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
//	classes: "ares_pview_popup",
	components: [
	{kind: "ServiceSelector", name: "serviceSelector"}
]
});