/*global ares, enyo, AresI18n, setTimeout, ServiceRegistry */

/* ilibProjectView covers Harmonia specific translations. */
var ilibHarmonia = AresI18n.resolve.bind(null, AresI18n.setBundle(navigator.language, "$assets/harmonia/resources"));

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
			{kind: "onyx.MoreToolbar", classes: "ares-top-toolbar ares-harmonia-panels", components: [
				{kind: "onyx.Grabber", classes: "ares-grabber" , name: "filePanelGrabber", showing: false, ontap: "activePanel", components: [
					{kind: "aresGrabber", name: "aresGrabberDirection"}
				]},
				{kind: "onyx.MenuDecorator", classes: "aresmenu", onSelect: "menuItemSelected", components: [
					{content: ilibHarmonia("Project"), name: "projectMenu", disabled: true},
					{kind: "onyx.Menu", floating: true, classes: "sub-aresmenu", maxHeight: "100%", components: [
						{value: "doModifySettings",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_edit.png"},
							{content: ilibHarmonia("Edit...")}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doPreview",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_preview.png"},
							{content: ilibHarmonia("Preview")}
						]},
						{name: "buildItem", value: "doBuild",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_build.png"},
							{content: ilibHarmonia("Build...")}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{name: "installItem", value: "doInstall",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_install.png"},
							{content: ilibHarmonia("Install...")}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{name: "runItem", value: "doRun",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_run.png"},
							{content: ilibHarmonia("Run...")}
						]},
						{name: "runDebugItem", value: "doRunDebug",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_debug.png"},
							{content: ilibHarmonia("Debug...")}
						]}
					]}
				]},
				{classes:"ares-logo-container", name: "logoContainer", components:[
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

		// i18n checking
		this.trace("ilibHarmonia: Cancel=", ilibHarmonia("Cancel"));
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
			this.manageBuildIntefaceAction();			
		} else {
			this.$.hermesFileTree.hideFileOpButtons().clear();
			setTimeout(next,0);
		}
	},

	/**
	 * Enable/Disable the build interfaces actions depending on wether or not the project use a provider implement a build interface.
	 * @private
	 */
	manageBuildIntefaceAction: function() {

		if(this.checkSelectedProjectProvidersType("build")) {
			this.$.buildItem.show();
			this.$.installItem.show();
			this.$.runItem.show();
			this.$.runDebugItem.show();
			
		} else {
			this.$.buildItem.hide();
			this.$.installItem.hide();
			this.$.runItem.hide();
			this.$.runDebugItem.hide();
		}
	},
	
	/**
	 * Test if at least one of the selected project provider implement the "build" interface.
	 * @private
	 */
	checkSelectedProjectProvidersType: function(inType) {
		// Array of the providers instances of the selected project
		var allProjectProviders = Ares.Workspace.projects.getSelectedProject().attributes.config.data.providers;
		
		var providers = {};
		for (var p in allProjectProviders) {

			// If the provider is enabled
			// Then append this profider instance in the array {providers}
			if(allProjectProviders[p].enabled) {
				providers[p] = allProjectProviders[p];
			}
		}

		// Array of the services instances that are loaded in Client Ares IDE.
		var services = this.getServicesByType(inType);

		// Tells if the project use at least one {inType} service
		var implementInterface = false;		

		// If at least one of the selected project provider implement the {inType} interface
		// Then "implementInterface" is set to "true"
		// Else "implementInterface" is set to "false"
		for(var key in providers) {
			for (var i = 0, servicesLength = services.length; i < servicesLength; i ++) {
				if(key === services[i].id) {
					implementInterface = true; break;
				}
			}
		}		

		return implementInterface;	
	}, 

	/**
	 * @return {Array} List of all the services that implement the "build" interface.
	 * @private
	 */
	getServicesByType: function(inType){
		return ServiceRegistry.instance.getServicesByType(inType);
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
