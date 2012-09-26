enyo.kind({
	name: "ProjectWizard",
	classes: "enyo-unselectable",
	fit: true,
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
			{fit: true},
			{kind: "FittableColumns", style: "margin-top: 10px", name: "fittableColumns5", components: [
					{kind: "Control", fit: true, name: "control7"},
					{kind: "onyx.Button", content: "Cancel", name: "cancel", ontap: "cancelTap"},
					{kind: "onyx.Button", content: "OK", name: "confirm", ontap: "confirmTap"}
				]}
		]},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup"}
    ],
    createMode: true,
    debug: false,
    reset: function() {
    	this.$.projectName.setValue("");
    	this.$.projectDirectory.setValue("");
    },
    setCreateMode: function(createMode) {
    	this.createMode = createMode;
    },
    browseTap: function(inSender, inEvent) {
        this.$.selectDirectoryPopup.show();
    },
    cancelTap: function(inSender, inEvent) {
        this.doCancel();
    },
    confirmTap: function(inSender, inEvent) {
		var name = this.$.projectName.getValue();
		var service = this.selectedDir.service;
		var selectedPath = null;
    	if (this.createMode === true) {
			var folderId = this.selectedDir.id;
			selectedPath = this.selectedDir.path + "/" + name;
			if (this.debug) this.log("Creating new folder " + name + " into folderId=" + folderId);
			service.createFolder(folderId, name)
				.response(this, function(inSender, inResponse) {
					this.doConfirmCreateProject({name: name, selectedPath: selectedPath, service: this.selectedDir.service, serviceId: this.selectedServiceId});
				})
				.error(this, function(inSender, inError) {
					// TODO handle the error
					this.log("Error: "+inError);
					this.doCancel();
				});
    	} else {
    		selectedPath = this.selectedDir.path;
    		this.doConfirmCreateProject({name: name, selectedPath: selectedPath, service: this.selectedDir.service, serviceId: this.selectedServiceId});
    	}
    },
    directorySelected: function(inSender, inEvent) {
    	this.selectedServiceId = inEvent.serviceId;
    	this.selectedDir = inEvent.directory;
    	this.$.projectDirectory.setValue(this.selectedDir.path);
    	this.$.selectDirectoryPopup.hide();
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
	components: [
        {kind: "ProjectWizard"}
	],
	reset: function() {
		this.$.projectWizard.reset();
	},
	setCreateMode: function(createMode) {
		this.$.projectWizard.setCreateMode(createMode);
	}
});