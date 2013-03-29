enyo.kind({
	name: "Harmonia",
	kind: "FittableColumns",
	handlers: {
		onSelect: "newSelect",
		onDeselect: "newDeselect"
	},
	components: [
		{name: "providerList", kind: "ProviderList", type: "filesystem", onSelectProvider: "handleSelectProvider"},
		{kind: "HermesFileTree", fit: true, onFileClick: "selectFile", onFolderClick: "selectFolder",
			onNewFileConfirm: "newFileConfirm", onNewFolderConfirm: "newFolderConfirm",
			onRenameConfirm: "renameConfirm", onDeleteConfirm: "deleteConfirm",
			onCopyFileConfirm: "copyFileConfirm"}
	],
	providerListNeeded: true,
	service: null,

	debug: false,
	create: function() {
		this.inherited(arguments);
		// TODO provider list should probably go out of Harmonia
		if (this.providerListNeeded === false) {
			this.$.providerList.setShowing(false);
		}
	},
	handleSelectProvider: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		if (inEvent.service) {
			this.service = inEvent.service ;
			this.$.hermesFileTree.connectService(inEvent.service);
		}
		this.$.hermesFileTree.hideFileOpButtons();
		return true; //Stop event propagation
	},
	setProject: function(project) {
		if (this.debug) this.log("project:", project);
		if (project !== null) {
			this.$.hermesFileTree.setConfig(project).showFileOpButtons();
			this.service = project.getService();
		} else {
			this.$.hermesFileTree.hideFileOpButtons().clear();
		}
	}
});
