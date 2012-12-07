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
	components: [
		{kind: "ProjectList",
			onModifySettings: "modifySettingsAction",
			onCreateProject: "createProjectAction",
			onScanProject: "scanProjectAction",
			onProjectRemoved: "projectRemoved",
			onProjectSelected: "handleProjectSelected",
			name: "projectList"},
		{kind: "Harmonia", fit:true, name: "harmonia", providerListNeeded: false},
		{kind: "ProjectWizardCreate", canGenerate: false, name: "projectWizardCreate"},
		{kind: "ProjectWizardScan", canGenerate: false, name: "projectWizardScan"},
		{kind: "ProjectWizardModify", canGenerate: false, name: "projectWizardModify"},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error", details: ""},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{kind: "Image", src: "$phobos/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
			{name: "waitPopupMessage", content: "Ongoing...", style: "padding-top: 10px;"}
		]}
	],
	handlers: {
		onAddProjectInList: "addProjectInList",
		onPhonegapBuild: "startPhonegapBuild",
		onBuildStarted: "phonegapBuildStarted",
		onPreview: "launchPreview",
		onError: "showError"
	},
	create: function() {
		this.inherited(arguments);
	},
	showError: function(inSender, inEvent) {
		if (this.debug) this.log("event:", inEvent, "from sender:", inSender);
		this.hideWaitPopup();
		this.showErrorPopup(inEvent.msg, inEvent.details);
		return true; //Stop event propagation
	},
	showErrorPopup : function(msg, details) {
		this.$.errorPopup.raise(msg, details);
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
		try {
			// Add an entry into the project list
			this.$.projectList.addProject(inEvent.name, inEvent.folderId, inEvent.service);
		} catch(e) {
				var msg = e.toString();
				this.showErrorPopup(msg);
				this.error(msg);
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
			if (err) self.showErrorPopup(err.toString());
			project.setConfig(config);
		});
		this.currentProject = project;
		return true; //Stop event propagation
	},
	projectRemoved: function(inSender, inEvent) {
		this.$.harmonia.setProject(null);
	},
	showWaitPopup: function(inMessage) {
		this.$.waitPopupMessage.setContent(inMessage);
		this.$.waitPopup.show();
	},
	hideWaitPopup: function() {
		this.$.waitPopup.hide();
	},
	startPhonegapBuild: function(inSender, inEvent) {
		if (!this.currentProject) {
			return true; // stop bubble-up
		}
		var self = this;
		this.showWaitPopup("Starting project build");
		// [0] assumes a single builder
		var bdService =	ServiceRegistry.instance.getServicesByType('build')[0];
		if (bdService) {
			bdService.build( /*project*/ {
				name: this.currentProject.getName(),
				filesystem: this.currentProject.getService(),
				folderId: this.currentProject.getFolderId(),
				config: this.currentProject.getConfig()
			}, function(inError, inDetails) {
				self.hideWaitPopup();
				if (inError) {
					self.showErrorPopup(inError.toString(), inDetails);
				}
			});
		} else {
			this.error("No build service defined:", inEvent);
			this.doError({msg: 'No build service defined'});
		}
		return true; // stop bubble-up
	},
	phonegapBuildStarted: function(inSender, inEvent) {
		this.showWaitPopup("Phonegap build started");
		setTimeout(enyo.bind(this, "hideWaitPopup"), 2000);
	},

	/**
	 * Launch a preview widget of the selected project in a separate frame
	 */
	launchPreview: function() {
		if ( this.currentProject ) {
			window.open(
				this.currentProject.getProjectUrl() + '/index.html' ,
				'Project preview',
				'scrollbars=auto, titlebar=yes, height=640,width=640',
				false
			);
		}
		return true; // stop the bubble
	}

});
