enyo.kind({
	name: "Harmonia",
	kind: "FittableColumns",
	components: [
		{kind: "HermesFileTree", fit: true}
	],
	debug: false,
	create: function() {
		this.inherited(arguments);
	},
	handleSelectProvider: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		if (inEvent.service) {
			this.$.hermesFileTree.connectService(inEvent.service);
		}
		this.$.hermesFileTree.hideFileOpButtons();
		return true; //Stop event propagation
	},
	setProject: function(project) {
		if (this.debug) this.log("project:", project);
		if (project !== null) {
			this.$.hermesFileTree.setConfig(project).showFileOpButtons();
		} else {
			this.$.hermesFileTree.hideFileOpButtons().clear();
		}
	},
	/**
	 * Refresh the {HermesFileTree} (if relevant), following a change of the given file
	 * @param {Object} changedFile
	 */
	refreshFile: function(changedFile) {
		this.$.hermesFileTree.refreshFile(changedFile);
	}
});
