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
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup"}
    ],
    // TODO Reset the projectName, ...
    browseTap: function(inSender, inEvent) {
        this.$.selectDirectoryPopup.show();
    },
    cancelTap: function(inSender, inEvent) {
        this.doCancel();
    },
    confirmTap: function(inSender, inEvent) {
        this.doConfirmCreateProject({name: this.$.projectName.getValue(), selectedDir: this.selectedDir, serviceId: this.selectedServiceId});
    },
    directorySelected: function(inSender, inEvent) {
    	this.selectedDir = inEvent.directory;
    	this.selectedServiceId = inEvent.serviceId;
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
	classes: "ares_pview_popup",
	components: [
        {kind: "ProjectWizard"}
	]
});