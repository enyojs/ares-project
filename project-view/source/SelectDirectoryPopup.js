enyo.kind({
	name: "SelectDirectoryPopup",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	debug: false,
	published: {
		headerText: ''  
	},
	headerTextChanged: function () {
		this.$.header.setContent(this.headerText);
	},
	components: [
		{kind: "FittableRows", style: "height: 400px; width: 600px", components: [
			{kind: "Control", tag: "span", style: "padding: 0 4px; vertical-align: middle;", content: "Select a directory", name: "header"},
			{kind: "FittableColumns", content: "fittableColumns", fit: true, components: [
				{kind: "ProviderList", type: "filesystem", name: "providerList", header: "Sources", onSelectProvider: "handleSelectProvider"},
				{kind: "HermesFileTree", fit: true, name: "hermesFileTree", onFileClick: "selectFile", onFolderClick: "selectFolder", onNewFolderConfirm: "createFolder"}
			]},
			{kind: "FittableColumns", content: "fittableColumns2", isContainer: true, components: [
				{kind: "Control", content: "Selected: ", fit: true, name: "selectedDir"},
				{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "cancel"},
				{kind: "onyx.Button", classes: "onyx-affirmative", content: "OK", isContainer: true, name: "confirm", ontap: "confirmTap"}
			]}
		]}
	],
	events: {
		onDirectorySelected: "",
		onDone: ""
	},
	selectedDir: undefined,
	create: function() {
		this.inherited(arguments);
		this.$.hermesFileTree.hideFileOpButtons();
	},
	handleSelectProvider: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		if (inEvent.service) {
			this.$.hermesFileTree
				.connectService(inEvent.service)
				.refreshFileTree(null, null,  inEvent.callBack);
		}
		return true; //Stop event propagation
	},
	selectFile: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.selectedDir = undefined;
		this.$.selectedDir.setContent("Selected: ");
		this.$.confirm.setDisabled(true);
		return true; // Stop event propagation
	},
	selectFolder: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.selectedDir = inEvent.file;
		this.$.selectedDir.setContent("Selected: " + this.selectedDir.path);
		this.$.confirm.setDisabled(false);
		return true; // Stop event propagation
	},
	confirmTap: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		this.doDirectorySelected({serviceId: this.selectedServiceId, directory: this.selectedDir});
		return true; // Stop event propagation 
	},
	cancel: function() {
		this.hide() ;
		this.doDone(); // inform owner
	},
	//FIXME: This is *nearly* identical to the code in Harmonia. Maybe move this into HermesFileTree?
	createFolder: function(inSender, inEvent) {
		var folderId = inEvent.folderId;
		var name = inEvent.fileName.trim();
		var service = this.selectedDir.service;
		if (this.debug) this.log("Creating new folder "+name+" into folderId="+folderId);
		service.createFolder(folderId, name)
			.response(this, function(inSender, inResponse) {
				if (this.debug) this.log("Response: "+inResponse);
				this.$.hermesFileTree.refreshFileTree(null, inResponse);
			})
			.error(this, function(inSender, inError) {
				if (this.debug) this.log("Error: "+inError);
				this.$.hermesFileTree.showErrorPopup("Creating folder "+name+" failed:" + inError);
			});
	}
});

