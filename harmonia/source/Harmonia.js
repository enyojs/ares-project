enyo.kind({
	name: "Harmonia",
	kind: "FittableColumns",
	events: {
		onRegisterMe: ""
	},
	components: [
		{kind: "HermesFileTree",  fit: true, dragAllowed: true}
	],
	debug: false,
	create: function() {
		this.inherited(arguments);
		this.doRegisterMe({name:"harmonia", reference:this});
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
			this.$.hermesFileTree.connectProject(project).showFileOpButtons();
		} else {
			this.$.hermesFileTree.hideFileOpButtons().clear();
		}
	},
	showGrabber:function(){
		this.$.hermesFileTree.showGrabber();
		return this ;
	},
	hideGrabber:function(){
		this.$.hermesFileTree.hideGrabber();
		return this ;
	},
	/**
	 * Refresh the {HermesFileTree} (if relevant), following a change of the given file
	 * @param {Object} changedFile
	 */
	refreshFile: function(changedFile) {
		this.$.hermesFileTree.refreshFile(changedFile);
	}
});
