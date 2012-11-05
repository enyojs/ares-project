enyo.kind({
	name: "ProjectWizardAny",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

	classes: "enyo-unselectable",
	handlers: {
		onDirectorySelected: "directorySelected"
	},

    showDirPopup: function(inSender, inEvent) {
        this.$.selectDirectoryPopup.show();
    },
	addProjectInList: function(name, folderId) {
		this.hide();
    	this.doConfirmCreateProject({name: name, folderId: folderId, service: this.selectedDir.service, serviceId: this.selectedServiceId});
	},
	createProjectInView: function(name, folderId) {
		this.addProjectInList(name,folderId);
    	this.doConfirmConfigProject({name: name, folderId: folderId, service: this.selectedDir.service});
	}
});

enyo.kind({
	name: "ProjectWizardCreate",
	kind: "ProjectWizardAny",

	events: {
		onConfirmCreateProject: "", 
		onConfirmConfigProject: ""
	},
	components: [
	    {kind: "FittableRows", fit: true, components: [
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Project name: "},
				{kind: "onyx.InputDecorator", components: [
					{kind: "Input", defaultFocus: true, placeholder: "Enter project name", name: "projectName", oninput: "updateProjectDir"}
				]}
			]},
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Location:"},
				{kind: "Control", content: "", name: "projectLocation", fit: true},
				{kind: "onyx.Button", content: "Browse", ontap: "showDirPopup"}
			]},
			{kind: "FittableColumns", name: "fittableColumns4", components: [
				{kind: "Control", content: "Project directory:"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", name: "projectDirectory", onchange: "enableConfirmButton"}
				]}
			]},
			{fit: true},
			{kind: "FittableColumns", style: "margin-top: 10px", name: "fittableColumns5", components: [
				{kind: "Control", fit: true},
				{kind: "onyx.Button", content: "Cancel", ontap: "hide"},
				{kind: "onyx.Button", content: "OK", name: "confirm", ontap: "createProject"}
			]}
		]},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup", onCancel: "cancelDirSelection"}
    ],
    debug: true,
    reset: function() {
    	this.$.projectName.setValue("");
    	this.$.projectDirectory.setValue("");
    	this.$.confirm.setDisabled(true);
		return this ;
    },
    cancelDirSelection: function() {
    	this.$.selectDirectoryPopup.hide();
    },
	createProject: function (inSender, inEvent) {
		var name = this.$.projectName.getValue();
		var subDir = this.$.projectDirectory.getValue() ;
		var folderId = this.selectedDir.id ;
		var service = this.selectedDir.service;
        var matchDirName = function(node){
			return (node.content === name) ;
		};
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;
		var matchingNodes = hft.getNodeFiles(hft.selectedNode).filter( matchDirName ) ;
			
		if ( matchingNodes.length === 0 ) {
			this.debug && this.log("Creating new folder " + name + " into folderId=" + folderId);

			service
				.createFolder(folderId, subDir)
				.response(this, function(inSender, newFolderId) {
					this.createProjectInView(name, newFolderId) ;
			})
			.error(this, function(inSender, inError) {
				// TODO display a popup to notify the error
				this.log("Error: "+inError);
				this.$.selectDirectoryPopup.hide();
			});
		}
		else {
			this.createProjectInView(name, matchingNodes[0].file.id) ;
		}
	},
    directorySelected: function(inSender, inEvent) {
    	this.selectedServiceId = inEvent.serviceId;
    	this.selectedDir = inEvent.directory;
    	this.$.projectLocation.setContent(this.selectedDir.path);
    	this.enableConfirmButton();
    	this.$.selectDirectoryPopup.hide();
    },
    updateProjectDir: function() {
		this.$.projectDirectory.setValue(this.$.projectName.getValue()) ;
		this.enableConfirmButton() ;
	},
    enableConfirmButton: function() {
    	if (    this.$.projectDirectory.getValue() 
			 && this.$.projectName     .getValue() 
			 && this.$.projectLocation .getContent()
		) {
    		this.$.confirm.setDisabled(false);
		} else {
			this.$.confirm.setDisabled(true);
		}
    }
});

enyo.kind({
	name: "ProjectWizardImport",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

	classes: "enyo-unselectable",
	events: {
		onConfirmCreateProject: "", 
		onConfirmConfigProject: ""
	},
	handlers: {
		onDirectorySelected: "directorySelected"
	},
	components: [
	    {kind: "FittableRows", fit: true, components: [
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Project name: "},
				{kind: "onyx.InputDecorator", components: [
					{kind: "Input", defaultFocus: true, placeholder: "Enter project name", name: "projectName", oninput: "updateProjectDir"}
				]}
			]},
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Location:"},
				{kind: "Control", content: "", name: "projectLocation", fit: true},
				{kind: "onyx.Button", content: "Browse", ontap: "showDirPopup"}
			]},
			{kind: "FittableColumns", name: "fittableColumns4", components: [
				{kind: "Control", content: "Project directory:"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", name: "projectDirectory", onchange: "enableConfirmButton"}
				]}
			]},
			{fit: true},
			{kind: "FittableColumns", style: "margin-top: 10px", name: "fittableColumns5", components: [
				{kind: "Control", fit: true},
				{kind: "onyx.Button", content: "Cancel", ontap: "hide"},
				{kind: "onyx.Button", content: "OK", name: "confirm", ontap: "confirmTap"}
			]}
		]},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup", onCancel: "cancelDirSelection"}
    ],
	// false when wizard is invoked through import project
    createMode: true,
    debug: false,
    reset: function() {
    	this.$.projectName.setValue("");
    	this.$.projectDirectory.setValue("");
    	this.$.confirm.setDisabled(true);
		return this ;
    },
    setCreateMode: function(createMode) {
    	this.createMode = createMode;
    },
    cancelDirSelection: function() {
    	this.$.selectDirectoryPopup.hide();
    },
	createProject: function (name, folderId, subDir) {
		var service = this.selectedDir.service;
		var matchingNode ;
        var matchFileName = function(node,name){
			return (n.name === name) ;
		};
		folderId = this.selectedDir.id;
		matchingNode = service.getNodesFiles.filter( matchFileName ) ;
			
		if (this.debug) this.log("Creating new folder " + name + " into folderId=" + folderId);

		service.createFolder(folderId, name)
			.response(this, function(inSender, inResponse) {
				this.importProject(name, folderId) ;
			})
			.error(this, function(inSender, inError) {
				// TODO handle the error
				this.log("Error: "+inError);
				this.doCancel();
			});
	},
	confirmTap: function(inSender, inEvent) {
		var name = this.$.projectName.getValue();
		var subDir = this.$.projectDirectory.getValue() ;
		var folderId = this.selectedDir.id ;
    	if (this.createMode === true) {
			this.createProject(name, folderId, subDir) ;
    	} else {
			this.importProject(name, this.selectedDir.service, subDir) ;
    	}
    },
    directorySelected: function(inSender, inEvent) {
    	this.selectedServiceId = inEvent.serviceId;
    	this.selectedDir = inEvent.directory;
    	this.$.projectLocation.setContent(this.selectedDir.path);
    	this.enableConfirmButton();
    	this.$.selectDirectoryPopup.hide();
    },
    updateProjectDir: function() {
		this.$.projectDirectory.setValue(this.$.projectName.getValue()) ;
		this.enableConfirmButton() ;
	},
    enableConfirmButton: function() {
    	if (    this.$.projectDirectory.getValue() 
			 && this.$.projectName     .getValue() 
			 && this.$.projectLocation .getContent()
		) {
    		this.$.confirm.setDisabled(false);
		} else {
			this.$.confirm.setDisabled(true);
		}
    }
});

