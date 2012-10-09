enyo.kind({
	name : "DirectorySelector",
	kind : "enyo.FittableRows",
	style: "height: 400px; width: 600px",
	components : [
	    {kind: "FittableColumns", content: "fittableColumns", fit: true, name: "fittableColumns", components: [
			{kind: "ProviderList", name: "providerList", onSelectProvider: "handleSelectProvider"},
			{kind: "HermesFileTree", fit: true, name: "hermesFileTree", onFileClick: "selectFile", onFolderClick: "selectFolder"}
		]},
	    {kind: "FittableColumns", content: "fittableColumns2", isContainer: true, name: "fittableColumns2", components: [
			{name: "selectedDir", fit: true, content: "Selected: "},
			{kind: "onyx.Button", content: "Cancel", ontap: "doCancel"},
			{kind: "onyx.Button", content: "OK", isContainer: true, name: "confirm", ontap: "confirmTap"}
		]}
    ],
	events: {
		onDirectorySelected: "",
		onCancel: ""
	},
	selectedDir: undefined,
	create: function() {
		this.inherited(arguments);
		this.$.hermesFileTree.fileOps2Hide(false);
	},
	handleSelectProvider: function(inSender, inEvent) {
		if (inEvent.service) {
			this.$.hermesFileTree.setConfig({fs: inEvent.service});
			this.$.hermesFileTree.reset();
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

enyo.kind({
	name: "SelectDirectoryPopup",
	kind: "onyx.Popup",
	events: {
	},
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	components: [
	    {kind: "DirectorySelector", name: "directotySelector"}
    ]
});