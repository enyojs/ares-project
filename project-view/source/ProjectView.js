enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	components: [
	    {kind: "ProjectList", onCreateProject: "createProjectAction", onProjectSelected: "showSelectedProject", name: "projectList"},
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
		var serviceInfo = {
			auth: auth,
			url: url,
			jsonp: jsonp
		};
		this.log("LET'S GO ... with: " + JSON.stringify(serviceInfo));
    	
    	// Add an entry into the project list
    	this.$.projectList.addProject(inEvent.name, inEvent.selectedDir.path, serviceInfo);
    	
    	// Pass service information to HermesFileTree
		this.$.hermesFileTree.setServiceInformation(serviceInfo);
		this.$.hermesFileTree.reset();
		
		return true; //Stop event propagation
    },
    showSelectedProject: function(inSender, inEvent) {
    	// Pass service information to HermesFileTree
		this.$.hermesFileTree.setServiceInformation(inEvent.serviceInfo);
		this.$.hermesFileTree.reset();
		
		return true; //Stop event propagation
    }
});

enyo.kind({
	name: "ProjectList",
	classes: "enyo-unselectable",
	style: "width: 300px",
	events: {
		onCreateProject: "",
		onProjectSelected: ""
	},
	handlers: {
	},
	projects: [],
	components: [
	    {kind: "onyx.Toolbar", isContainer: true, name: "toolbar", components: [
			{kind: "onyx.Button", content: "Create Project", ontap: "doCreateProject"},
			{kind: "onyx.Button", content: "Open Project", ontap: "doOpenProject"}
		]},
	    {kind: "enyo.Repeater", style: "height: 300px", controlParentName: "client", fit: true, name: "projectList", onSetupItem: "projectListSetupItem", ontap: "projectListTap", components: [
                {kind: "Project", name: "item", classes: "enyo-children-inline"}
	        ]}
	],
	addProject: function(name, selectedDirPath, serviceInfo) {
		var project = {name: name, selectedDirPath: selectedDirPath, serviceInfo: serviceInfo};
		this.projects.push(project);
		this.log("Adding project " + name + " ==> nb projects: " + this.projects.length);
		this.$.projectList.setCount(this.projects.length);
		this.$.projectList.render();
	},
	projectListSetupItem: function(inSender, inEvent) {
	    var project = this.projects[inEvent.index];
	    this.log(" ==> index: " + inEvent.index + " name: " + project.name);
	    var item = inEvent.item;
	    // setup the controls for this item.
	    item.$.item.setProjectName(project.name);
	},
    projectListTap: function(inSender, inEvent) {
    	this.log("Project tapped: " + inEvent.index);
    	console.dir(inEvent);
    	this.doProjectSelected(this.projects[inEvent.index]);
    }
});

enyo.kind({
	name: "Project",
	published: {
		projectName: ""
	},
	components: [
	    {name: "name"}
	],
	projectNameChanged: function(inOldValue) {
		this.log("new project name: >>" + + this.projectName + "<<");
        this.$.name.setContent(this.projectName);
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
    	this.log("YES");						// TODO TBR
    	console.dir(this.selectedDir);
    	this.$.projectDirectory.setValue(this.selectedDir.path);
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
		this.log("Selected folder: " + this.selectedDir);
		console.dir(this.selectedDir);
		this.$.selectedDir.setContent("Selected: " + this.selectedDir.path);
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