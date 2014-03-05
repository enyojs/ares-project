/*global ares, enyo, AresI18n, ServiceRegistry, setTimeout */

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
		onPreview: "",
		onProjectSave: "",
		onShowWaitPopup: "",
		onError: ""
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
						{value: "doBuild",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_build.png"},
							{content: ilibHarmonia("Build...")}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doInstall",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_install.png"},
							{content: ilibHarmonia("Install...")}
						]},
						{classes: "onyx-menu-divider aresmenu-button"},
						{value: "doRun",  classes: "aresmenu-button", components: [
							{kind: "onyx.IconButton", src: "$assets/project-view/images/project_view_run.png"},
							{content: ilibHarmonia("Run...")}
						]},
						{value: "doRunDebug",  classes: "aresmenu-button", components: [
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
	/**
	 * Request to save project and perform action
	 * @param {Ares.Model.Project} project
	 * @param {String} serviceType
	 * @param {String} action
	 */
	projectSaveAndAction: function(project, serviceType, action) {
		var cb = function (err) {
			if (err) {
				this.trace(err);
			} else {
				this.projectAction( project, serviceType, action);
			}
		};
		if (project) {
			this.doProjectSave({ project: project, callback: cb.bind(this) });
		}
	},
	/**
	 * @private
	 */
	projectAction: function(project, serviceType, action) {
		var self = this;
		this.doShowWaitPopup({msg: "Starting: " + action, service: serviceType});
		// TODO: Must be reworked to allow the selection of builder/tester in the UI - ENYO-2049
		var services = ServiceRegistry.instance.getServicesByType(serviceType);
		var provider =	services[services.length - 1];
		if (!provider) {
			this.doError({msg: 'No ' + serviceType + ' service available'});
		} else if (typeof provider[action] !== 'function') {
			this.doError({msg: 'Service ' + provider.name + ' does not provide action: ' + action});
		} else {
			// Check if PhoneGap Build plugin is enabled that at least one target has been selected
			if (serviceType === "build" && action === "build") {
				var abortMsg = "";
				if (project) {
					var config = project.getConfig();
					if (config && config.data && config.data.providers) {
						var phonegap = config.data.providers.phonegap;
						if (phonegap !== undefined) {
							if (phonegap.enabled) {
								var targets = phonegap.targets;
								if (targets !== undefined && Object.keys(targets).length === 0) {
									abortMsg = "No targets selected, build aborted";
								}
							} else {
								abortMsg = "Phonegap build not enabled, build aborted";
							}							
						} else {
							abortMsg = "No PhoneGap Build configuration, build aborted";
						}				
					} else {
						abortMsg = "No project configuration available, build aborted";
					}
				} else {
					abortMsg = "No project selected, build aborted";
				}
				
				if (abortMsg !== "") {
					this.doError({msg: abortMsg});
					this.doHideWaitPopup();
					return true;
				}
			}
			
			provider[action](project, function(inError) {
				self.doHideWaitPopup();
				self.refreshFileTree(project.getFolderId());
				if (inError) {
					self.doError({msg: inError.toString(), err: inError});
				}
			});
		}
	},

	launchPreview: function (project) {
		var cb = function (err) {
			if (err) {
				this.trace(err);
			} else {
				this._launchPreview(project);
			}
		};
		this.doProjectSave({ project: project, callback: cb.bind(this) });
	},

	_launchPreview: function (project) {
		var config = project.getConfig() ;
		var topFile = config.data.preview.top_file ;
		var projectUrl = project.getProjectUrl() + '/' + topFile ;

		var winLoc = window.location.toString()
			    .replace(/\/ide\/$/,'/preview/index.html') // Ares std
			    .replace('/ide/index.html','/preview/index.html') // Ares minified
			    .replace('/ide/debug.html','/preview/debug.html') // Ares debug (every files)
			    .replace('/ide/test.html','/preview/test.html'); // Ares-under-test
		var previewUrl = winLoc
				+ ( winLoc.indexOf('?') != -1 ? '&' : '?' )
				+ 'url=' + encodeURIComponent(projectUrl)+'&name=' + project.id;

		this.trace("preview on URL ", previewUrl) ;
		
		window.open(
			previewUrl,
			'_blank', // ensure that a new window is created each time preview is tapped
			'scrollbars=0,menubar=1,resizable=1',
			false
		);
	}
});
