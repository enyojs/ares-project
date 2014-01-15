/*global ServiceRegistry, ProjectConfig, ares, ComponentsRegistry, async, enyo */
/**
 * This kind is the top kind of project handling. It contains:
 * - The project list
 * - the interface towards the user's file (harmonia)
 * - Popups to manage projects (create, scan, error ...)
 */
enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable",
	debug: false,
	published: {
		// harcoded until ENYO-2755 is fixed
		panelIndex: 0
	},
	components: [
		{kind: "ProjectList",
			onModifySettings: "modifySettingsAction",
			onCreateProject: "createProjectAction",
			onOpenProject: "openProjectAction",
			onSearchProjects: "searchProjectsAction",
			onDuplicateProject: "duplicateProjectAction",
			onProjectRemoved: "projectRemoved",
			name: "projectList"
		},
		{kind: "ProjectWizardCreate", canGenerate: false, name: "projectWizardCreate", classes:"ares-masked-content-popup"},
		{kind: "ProjectWizardScan", canGenerate: false, name: "projectWizardScan", classes:"ares-masked-content-popup"},
		{kind: "ProjectWizardModify", canGenerate: false, 
			name: "projectWizardModify"
		},
		{kind: "ProjectWizardCopy", name: "projectWizardCopy", classes:"ares-masked-content-popup"}
	],
	handlers: {
		onAddProjectInList: "addProjectInList",
		onPreview: "previewAction",
		onBuild: "buildAction",
		onInstall: "installAction",
		onRun: "runAction",
		onRunDebug: "runDebugAction"
	},
	events: {
		onHideWaitPopup: "",
		onShowWaitPopup: "",
		onError: "",
		onProjectSelected: "",
		onRegisterMe: ""
	},
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.doRegisterMe({name:"projectView", reference:this});
	},
	/**
	 * Refresh the {ProjectView} (if relevant), following a change of the given file
	 * @param {Object} toSelectId. Asynchronous
	 */
	refreshFileTree: function(toSelectId,next) {
		ComponentsRegistry.getComponent("harmonia").refreshFileTree(toSelectId,next);
	},
	searchProjectsAction: function(inSender, inEvent) {
		this.$.projectWizardScan.setHeaderText('Select a folder hierarchy');
		this.$.projectWizardScan.setRecurse(true);
		this.$.projectWizardScan.show();
		return true; //Stop event propagation
	},
	openProjectAction: function(inSender, inEvent) {
		this.$.projectWizardScan.setHeaderText('Select an existing Ares application folder (contains a project.json file)');
		this.$.projectWizardScan.setRecurse(false);
		this.$.projectWizardScan.show();
		return true; //Stop event propagation
	},
	duplicateProjectAction: function(InSender, inEvent) {	
		if(InSender.selected == null){	
			this.doError({msg: "Please project list select item."});
			return false;
		}
		
		this.$.projectWizardCopy.start(this.currentProject);
		return true; //Stop event propagation
	},
	createProjectAction: function(inSender, inEvent) {
		this.$.projectWizardCreate.start();
		return true; //Stop event propagation
	},
	modifySettingsAction: function(inSender, inEvent) {
		this.$.projectWizardModify.start(this.currentProject);
		
		return true; //Stop event propagation
	},

	addProjectInList: function(inSender, inEvent) {
		this.doHideWaitPopup();
		try {
			// Add an entry into the project list
			this.$.projectList.addProject(inEvent.name, inEvent.folderId, inEvent.service, inEvent.dontSelect);
		} catch(e) {
			var msg = e.toString();
			this.error(msg);
			this.doError({msg: msg});
			return false;
		}
		return true; //Stop event propagation
	},
	/**
	 *
	 * @param {Object} project
	 * @param {Function} next
	 */
	setupProjectConfig: function(project, next) {
		ares.assertCb(next);

		var pname = project.getName();
		if ( this.currentProject && pname === this.currentProject.getName()) {
			this.trace("skip setup of already selected project" + pname);
			next();
			return;
		}

		// FIXME: temporary hack to create config.json on the
		// fly if needed... would be better to create/load it
		// when the workspace is loaded & when a new project
		// is created that would save per-click HTTP traffic
		// to the FileSystemService.
		var self = this;
		var config = new ProjectConfig();
		this.trace("setup project config init on "+ project.getName() );
		self.currentProject = project;
		var initData = {
			service: project.getService(),
			folderId: project.getFolderId()
		};

		async.series(
			[
				// read default config from remote server
				config.init.bind(config, initData) ,
				function (next) {
					self.trace("ProjectView: setup project set config on "+ project.getName() );
					project.setConfig(config);
					
					self.initializeDownloadStatus(project, config.data.providers.phonegap.enabled);
					self.initializeValidPgbConf(project, config.data.providers.phonegap.enabled);
					next();
				},
				function (next) {
					// Pass service definition & configuration to Harmonia
					// & consequently to HermesFileTree
					self.trace("ProjectView: setup project on harmonia "+ project.getName() );
					ComponentsRegistry.getComponent("harmonia").setProject(project, next);
				}

			],
			function (err) {
				self.trace("ProjectView: setup project config done on " + project.getName() + " err is ",err );
				if (err) {
					self.doError({msg: err.toString(), err: err});
				} 
				next(err);
			}
		);
	},
	/**
	 * Initialize the attribute "downloadStatus" of the project
	 *
	 * this attribute is used only by Phonegap Build.
	 * @private
	 */
	initializeDownloadStatus: function(inProject, inPhonegapEnabled) {
		if (inProject.getDownloadStatus() === undefined && inPhonegapEnabled) {
			inProject.setDownloadStatus({
				"android": "Ready for download", 
				"ios": "Ready for download", 
				"winphone": "Ready for download", 
				"blackberry": "Ready for download", 
				"webos": "Ready for download"
			});
		}
	},

	initializeValidPgbConf: function(inProject, inPhonegapEnabled) {
		if (inProject.getValidPgbConf() === undefined && inPhonegapEnabled) {
			inProject.setValidPgbConf({
				"sharedConfiguration": {
					"validDrawer": true,
					"phonegap-version": true,
					"orientation": true,
					"target-device": true,
					"fullscreen": true,
					"icon": true,
					"splashScreen": true
				},
				"android": {
					"validDrawer": true,
					"android-installLocation": true,
					"android-minSdkVersion": true, 
					"android-targetSdkVersion": true,
					"android-maxSdkVersion": true,
					"android-windowSoftInputMode": true,
					"splash-screen-duration": true,
					"load-url-timeout": true,
					"icon": true,
					"splashScreen": true
				},
				"ios": {
					"validDrawer": true,
					"webviewbounce": true,
					"prerendered-icon": true,
					"ios-statusbarstyle": true, 
					"detect-data-types": true,
					"exit-on-suspend": true,
					"show-splash-screen-spinner": true,
					"auto-hide-splash-screen": true,
					"icon": true,
					"splashScreen": true
				},
				"winphone": {
					"validDrawer": true,
					"icon": true,
					"splashScreen": true
				},
				
				"blackberry": {
					"validDrawer": true,
					"disable-cursor": true,
					"icon": true,
					"splashScreen": true
				},
				"webos": {
					"validDrawer": true,
					"icon": true,
					"splashScreen": true
				}				
			});
		}
	},

	projectRemoved: function(inSender, inEvent) {
		ComponentsRegistry.getComponent("harmonia").setProject(null);
	},
	/**
	 * Event handler: handle build project action (select provider & run action)
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project 
	 * @private
	 */
	buildAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (project) {
			this.projectAction(project, 'build', 'build');
		}
		return true; // stop bubble-up
	},
	
	/**
	 * Event handler: handle install application action (select provider & run action)
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project
	 * @private
	 */
	installAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (project) {
			this.projectAction(project, 'test', 'install');
		}
		return true; // stop bubble-up
	},
	/**
	 * Event handler: handle run application action (select provider & run action)
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project
	 * @private
	 */
	runAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (project) {
			this.projectAction(project, 'test', 'run');
		}
		return true; // stop bubble-up
	},
	/**
	 * Event handler: handle debug application action (select provider & run action)
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project
	 * @private
	 */
	runDebugAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (project) {
			this.projectAction(project, 'test', 'runDebug');
		}
		return true; // stop bubble-up
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
		var config = project.getConfig() ;
		var topFile = config.data.preview.top_file ;
		var projectUrl = project.getProjectUrl() + '/' + topFile ;

		// the last replace method is needed for test environment only
		var winLoc = window.location.toString().replace('ares','preview').replace('test', 'index') ;
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
	},

	/**
	 * Event handler: Launch a preview widget of the selected project in a separate frame
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project 
	 * @private
	 */
	previewAction: function(inSender, inEvent) {
		var project = inEvent.project;
		if ( project) {
			this.launchPreview(project);
		}
		return true; // stop the bubble
	}
});
