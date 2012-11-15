enyo.kind({
	name: "SelectDirectoryPopup",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	components: [{
		kind : "enyo.FittableRows",
		style: "height: 400px; width: 600px",
		components : [
			{kind: "FittableColumns", content: "fittableColumns", fit: true, components: [
				 {kind: "ProviderList", type: "filesystem", onSelectProvider: "handleSelectProvider"},
				 {kind: "HermesFileTree", fit: true, name: "hermesFileTree", onFileClick: "selectFile", onFolderClick: "selectFolder"}
			 ]},
			{kind: "FittableColumns", content: "fittableColumns2", isContainer: true, components: [
				 {name: "selectedDir", fit: true, content: "Selected: "},
			{kind: "onyx.Button", content: "Cancel", classes: "onyx-negative", ontap: "doCancel"},
			{kind: "onyx.Button", content: "OK", classes: "onyx-affirmative", isContainer: true, name: "confirm", ontap: "confirmTap"}
			 ]}
		],
	}],
	events: {
		onDirectorySelected: "",
		onCancel: ""
	},
	selectedDir: undefined,
	create: function() {
		this.inherited(arguments);
		this.$.hermesFileTree.hideFileOpButtons().showNewFolderButton();
	},
	handleSelectProvider: function(inSender, inEvent) {
		if (inEvent.service) {
			this.$.hermesFileTree
				.connectService(inEvent.service)
				.refreshFileTree();
		}
		return true; //Stop event propagation
	},
	selectFile: function(inSender, inEvent) {
		this.selectedDir = undefined;
		this.$.selectedDir.setContent("Selected: ");
		this.$.confirm.setDisabled(true);
		return true; // Stop event propagation
	},
	selectFolder: function(inSender, inEvent) {
		this.selectedDir = inEvent.file;
		this.$.selectedDir.setContent("Selected: " + this.selectedDir.path);
		this.$.confirm.setDisabled(false);
		return true; // Stop event propagation
	},
    confirmTap: function(inSender, inEvent) {
        this.doDirectorySelected({serviceId: this.selectedServiceId, directory: this.selectedDir});
        return true; // Stop event propagation 
    }
});

