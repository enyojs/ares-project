enyo.kind({
	name: "ProjectWizard",
	classes: "enyo-unselectable",
	fit: true,
	events: {
		onCancel: "",
		onConfirmCreateProject: "", 
		onConfirmConfigProject: ""
	},
	handlers: {
		onDirectorySelected: "directorySelected"
	},
	components: [
	    {kind: "FittableRows", fit: true, name: "fittableRows", components: [
			{kind: "FittableColumns", name: "fittableColumns", components: [
					{kind: "Control", content: "Project name: ", name: "control"},
					{kind: "onyx.InputDecorator", content: "Project name", name: "inputDecorator", components: [
							{kind: "Input", defaultFocus: true, placeholder: "Enter project name", name: "projectName", onchange: "enableConfirmButton"}
						]}
				]},
			{kind: "FittableColumns", name: "fittableColumns4", components: [
					{kind: "Control", content: "Directory:", name: "control5"},
					{kind: "onyx.InputDecorator", name: "inputDecorator2", components: [
							{kind: "onyx.Input", placeholder: "Enter text here", name: "projectDirectory", onchange: "enableConfirmButton"}
						]},
					{kind: "onyx.Button", content: "Browse", name: "browse", ontap: "browseTap"}
				]},
			{fit: true},
			{kind: "FittableColumns", style: "margin-top: 10px", name: "fittableColumns5", components: [
					{kind: "Control", fit: true, name: "control7"},
					{kind: "onyx.Button", content: "Cancel", classes: "onyx-negative", name: "cancel", ontap: "doCancel"},
					{kind: "onyx.Button", content: "OK", classes: "onyx-affirmative", name: "confirm", ontap: "confirmTap"}
				]}
		]},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup", onCancel: "cancelDirSelection"}
    ],
    createMode: true,
    debug: false,
    reset: function() {
    	this.$.projectName.setValue("");
    	this.$.projectDirectory.setValue("");
    	this.$.confirm.setDisabled(true);
    },
    setCreateMode: function(createMode) {
    	this.createMode = createMode;
    },
    browseTap: function(inSender, inEvent) {
        this.$.selectDirectoryPopup.show();
    },
    cancelDirSelection: function() {
    	this.$.selectDirectoryPopup.hide();
    },
    confirmTap: function(inSender, inEvent) {
		var name = this.$.projectName.getValue();
		var service = this.selectedDir.service;
		var folderId;
    	if (this.createMode === true) {
			folderId = this.selectedDir.id;
			if (this.debug) this.log("Creating new folder " + name + " into folderId=" + folderId);
			service.createFolder(folderId, name)
				.response(this, function(inSender, inResponse) {
					this.doConfirmCreateProject({name: name, folderId: inResponse, service: this.selectedDir.service, serviceId: this.selectedServiceId});
					this.doConfirmConfigProject({name: name, folderId: inResponse, service: this.selectedDir.service});
				})
				.error(this, function(inSender, inError) {
					// TODO handle the error
					this.log("Error: "+inError);
					this.doCancel();
				});
    	} else {
    		folderId = this.selectedDir.id;
    		this.doConfirmCreateProject({name: name, folderId: folderId, service: this.selectedDir.service, serviceId: this.selectedServiceId});
    		this.doConfirmConfigProject({name: name, folderId: folderId, service: this.selectedDir.service});
    	}
    },
    directorySelected: function(inSender, inEvent) {
    	this.selectedServiceId = inEvent.serviceId;
    	this.selectedDir = inEvent.directory;
    	this.$.projectDirectory.setValue(this.selectedDir.path);
    	this.enableConfirmButton();
    	this.$.selectDirectoryPopup.hide();
    },
    enableConfirmButton: function() {
    	if ((this.$.projectDirectory.getValue() !== "") && (this.$.projectName.getValue() !== "")) {
    		this.$.confirm.setDisabled(false);
		} else {
			this.$.confirm.setDisabled(true);
		}
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