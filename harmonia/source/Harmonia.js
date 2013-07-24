/* global ares */

enyo.kind({
	name: "Harmonia",
	events: {
		onRegisterMe: "",
		onMovePanel:"",
	},
	components: [
		{kind: "HermesFileTree", dragAllowed: true, classes:"enyo-fit"}
	],
	handlers: {
		onGrabberClick : "activePanel"
	},
	debug: false,
	published: {
		panelIndex: 1
	},
	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
		this.doRegisterMe({name:"harmonia", reference:this});
	},
	handleSelectProvider: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		if (inEvent.service) {
			this.$.hermesFileTree.connectService(inEvent.service);
		}
		this.$.hermesFileTree.hideFileOpButtons();
		return true; //Stop event propagation
	},
	setProject: function(project) {
		this.trace("project:", project);
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
	switchGrabberDirection: function(active){
		this.$.hermesFileTree.switchGrabberDirection(active);
	},
	/**
	 * Refresh the {HermesFileTree} (if relevant), following a change of the given file
	 * @param {Object} changedFile
	 */
	refreshFile: function(changedFile) {
		this.$.hermesFileTree.refreshFile(changedFile);
	},
	activePanel : function(){
		this.doMovePanel({panelIndex:this.panelIndex});
	}
});
