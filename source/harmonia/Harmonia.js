/*global ares, enyo, setTimeout */

enyo.kind({
	name: "Harmonia",
	kind:"FittableColumns",
	events: {
		onRegisterMe: "",
		onMovePanel: "",
		onModifySettings: "",
		onBuild: "",
		onInstall: "",
		onRun: "",
		onRunDebug: "",
		onPreview: ""
	},
	handlers: {
		onDisableProjectMenu: "disableProjectMenu"
	},
	components: [
		{kind:"FittableRows", classes:"enyo-fit", components:[
			{kind: "onyx.Toolbar", classes: "ares-top-toolbar", components: [
				{kind: "onyx.Grabber", classes: "ares-grabber" , name: "filePanelGrabber", showing: false, ontap: "activePanel", components: [
					{kind: "aresGrabber", name: "aresGrabberDirection"}
				]},
				{kind: "onyx.MenuDecorator", classes:"aresmenu", onSelect: "menuItemSelected", components: [
					{content: "Project", name: "projectMenu", disabled: true},
					{kind: "onyx.Menu", floating: true, classes:"sub-aresmenu", maxHeight: "100%", components: [
						{value: "doModifySettings",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_edit.png"},
							{content: "Edit..."}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doPreview",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_preview.png"},
							{content: "Preview"}
						]},
						{value: "doBuild",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_build.png"},
							{content: "Build..."}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doInstall",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_install.png"},
							{content: "Install..."}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doRun",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_run.png"},
							{content: "Run..."}
						]},
						{value: "doRunDebug",  classes:"aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_debug.png"},
							{content: "Debug..."}
						]}
					]}
				]},
				{classes:"ares-logo-container", name:"logoContainer", components:[
					{name:"logo", kind:"Ares.Logo"}
				]}
			]},
			{kind: "HermesFileTree", dragAllowed: true, menuAllowed: true}
		]},
		{classes:"hangar"}
	],
	debug: false,
	published: {
		// harcoded until ENYO-2755 is fixed
		panelIndex: 1
	},
	project: null,
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
	setProject: function(project, next) {
		ares.assertCb(next);
		this.trace("project:", project);
		if (project !== null) {
			this.$.hermesFileTree.connectProject(project, next).showFileOpButtons();
			this.project = project;
		} else {
			this.$.hermesFileTree.hideFileOpButtons().clear();
			setTimeout(next,0);
		}
	},
	showGrabber:function(){
		this.$.filePanelGrabber.show();
	},
	hideGrabber:function(){
		this.$.filePanelGrabber.hide();
	},
	switchGrabberDirection: function(active){
		this.$.aresGrabberDirection.switchGrabberDirection(active);
	},
	/**
	 * Refresh the {HermesFileTree}
	 * @param {Object} toSelectId - changed file id
	 * @param {Function} [callback] - optional callback
	 */
	refreshFileTree: function(toSelectId,next) {
		// the inversion of parameter is not an error.
		// next parameter is optional (can be null or undef)
		// ENYO-3641
		this.$.hermesFileTree.refreshFileTree(next, toSelectId);
	},
	activePanel : function(){
		this.doMovePanel({panelIndex:this.panelIndex});
	},
	showLogo:function(){
		this.$.logoContainer.show();
	},
	hideLogo:function(){
		this.$.logoContainer.hide();
	},
	/** @public */
	disableProjectMenu: function(disabled){
		this.$.projectMenu.setDisabled(disabled);
	},
	/**
	 * Generic event handler
	 * @private
	 */
	menuItemSelected: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);
		var fn = inEvent && inEvent.selected && inEvent.selected.value;
		if (typeof this[fn] === 'function') {
			this[fn]({project: this.project});
		} else {
			this.trace("*** BUG: '", fn, "' is not a known function");
		}
	},
});
