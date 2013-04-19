/**
 * This kind is the top kind of project handling. It contains:
 * - The project list
 * - the interface towards the user's file (harmonia)
 * - Popups to manage projects (create, scan, error ...)
 */
enyo.kind({
	name: "ProjectView",
	kind: "FittableColumns",
	classes: "enyo-unselectable shadow-panels",
	components: [
		{kind: "ProjectList",
			onModifySettings: "modifySettingsAction",
			onCreateProject: "createProjectAction",
			onScanProject: "scanProjectAction",
			onProjectRemoved: "projectRemoved",
			onProjectSelected: "handleProjectSelected",
			name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia"},
		{kind: "ProjectWizardCreate", canGenerate: false, name: "projectWizardCreate"},
		{kind: "ProjectWizardScan", canGenerate: false, name: "projectWizardScan"},
		{kind: "ProjectWizardModify", canGenerate: false, name: "projectWizardModify"}
	],
	handlers: {
		onAddProjectInList: "addProjectInList",
		onPreviewProject: "previewProjectAction",
		onBuildProject: "buildProjectAction"
	},
	events: {
		onHideWaitPopup: "",
		onShowWaitPopup: "",
		onError: ""
	},
	create: function() {
		this.inherited(arguments);
	},
	/**
	 * Refresh the {ProjectView} (if relevant), following a change of the given file
	 * @param {Object} changedFile
	 */
	refreshFile: function(changedFile) {
		this.$.harmonia.refreshFile(changedFile);
	},
	scanProjectAction: function(inSender, inEvent) {
		this.$.projectWizardScan.setHeaderText('Select a directory containing one or more project.json files');
		this.$.projectWizardScan.show();
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
			this.$.projectList.addProject(inEvent.name, inEvent.folderId, inEvent.service);
		} catch(e) {
				var msg = e.toString();
				this.error(msg);
				this.doError({msg: msg});
				return false;
		}
		return true; //Stop event propagation
	},
	handleProjectSelected: function(inSender, inEvent) {
		var project = inEvent.project;
		// Pass service definition & configuration to Harmonia
		// & consequently to HermesFileTree
		this.$.harmonia.setProject(project);
		// FIXME: temporary hack to create config.json on the
		// fly if needed... would be better to create/load it
		// when the workspace is loaded & when a new project
		// is created that would save per-click HTTP traffic
		// to the FileSystemService.
		self = this;
		var config = new ProjectConfig();
		config.init({
			service: project.getService(),
			folderId: project.getFolderId()
		}, function(err) {
			if (err) self.doError({msg: err.toString(), err: err});
			project.setConfig(config);
		});
		this.currentProject = project;
	},
	projectRemoved: function(inSender, inEvent) {
		this.$.harmonia.setProject(null);
	},
	/**
	 * Event handler: Select the project builder
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project 
	 * @private
	 */
	buildProjectAction: function(inSender, inEvent) {
		var project = inEvent && inEvent.project;
		if (!project) {
			return true; // stop bubble-up
		}
		var self = this;
		this.doShowWaitPopup({msg: "Starting project build"});
		// TODO: Must be reworked to allow the selection of builder in the UI - ENYO-2049
		var services = ServiceRegistry.instance.getServicesByType('build');
		var bdService =	services[services.length - 1];
		if (bdService) {
			bdService.build( /*project*/ {
				name: project.getName(),
				filesystem: project.getService(),
				folderId: project.getFolderId(),
				config: project.getConfig()
			}, function(inError, inDetails) {
				self.doHideWaitPopup();
				self.doError({msg: inError.toString(), err: inError, details: inDetails});
			});
		} else {
			this.error("No build service defined:", inEvent);
			this.doError({msg: 'No build service defined'});
		}
		return true; // stop bubble-up
	},
	/**
	 * Event handler: Launch a preview widget of the selected project in a separate frame
	 * @param {enyo.Component} inSender
	 * @param {Object} inEvent
	 * @property inEvent {Ares.Model.Project} project 
	 * @private
	 */
	previewProjectAction: function(inSender, inEvent) {
		var project = inEvent.project;
		if ( project) {
			var config = project.getConfig() ;
			var topFile = config.data.preview.top_file ;
			var projectUrl = project.getProjectUrl() + '/' + topFile ;

			// the last replace method is needed for test environment only
			var winLoc = window.location.toString().replace('ares','preview').replace('test', 'index') ;
			var previewUrl = winLoc
				+ ( winLoc.indexOf('?') != -1 ? '&' : '?' )
				+ 'url=' + encodeURIComponent(projectUrl);

			if (this.debug) this.log("preview on URL " + previewUrl) ;

			window.open(
				previewUrl,
				'_blank', // ensure that a new window is created each time preview is tapped
				'scrollbars=0,menubar=1',
				false
			);
		}
		return true; // stop the bubble
	}
});
