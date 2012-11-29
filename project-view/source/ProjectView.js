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
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error", details: ""},
		{kind: "ProjectPropertiesPopup", name: "projectPropertiesPopup"},
		{name: "waitPopup", kind: "onyx.Popup", centered: true, floating: true, autoDismiss: false, modal: true, style: "text-align: center; padding: 20px;", components: [
			{kind: "Image", src: "$phobos/images/save-spinner.gif", style: "width: 54px; height: 55px;"},
			{name: "waitPopupMessage", content: "Ongoing...", style: "padding-top: 10px;"}
		]}
	],
	handlers: {
		onConfirmCreateProject: "confirmCreateProject",
		onConfirmConfigProject: "setupConfigProject",
		onInitConfigProject: "initConfigProject",
		onCustomConfigProject: "customConfigProject",
		onFinishProjectConfig: "finishConfigProject",
		onCancelSettings: "cancelSettings",
		onSaveGeneratedXml: "saveGeneratedXml",
		onPhonegapBuild: "startPhonegapBuild",
		onBuildStarted: "phonegapBuildStarted",
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
	confirmCreateProject: function(inSender, inEvent) {
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
		project.config = new ProjectConfig();
		project.config.init({
			service: project.service,
			folderId: project.folderId
		}, function(err) {
			if (err) self.showErrorPopup(err.toString());
		});
		this.currentProject = project;
		return true; //Stop event propagation
	},
	projectRemoved: function(inSender, inEvent) {
		this.$.harmonia.setProject(null);
	},
	setupConfigProject: function(inSender, inEvent) {
		this.log("stubbed");
		/*
		try {
			// data to create the project properties file
			var projectData = {
					name: inEvent.name,
					folderId: inEvent.folderId,
					service: inEvent.service
			};
			this.$.projectConfig.createConfig(projectData)
				.response(this, function() {
					// Pass service information to Harmonia
					// *once* project.json has been created
					this.$.harmonia.setProject(projectData);
				}) ;
		} catch(e) {
			this.showErrorPopup(e.toString());
			return false;
		}
		// handled here (don't bubble)
		return true;
		 */
	},
	initConfigProject: function(inSender, inEvent) {
		this.log("stubbed");
		/*
		// push project data in project list
		this.$.projectList.storeBaseConfigProject(inEvent.name, inEvent.folderId, inEvent.properties);
		// pre-filled and customized projectPropertiesPopup fields
		this.$.projectPropertiesPopup.preFillConfig(inEvent.properties);
	},
	customConfigProject: function(inSender, inEvent) {
		// retrieve data modified  and store into projectConfig on FS
		this.$.projectList.storeCustomConfigProject(inEvent);
		 */
	},
	finishConfigProject: function(inSender, inEvent) {
		this.log("stubbed");
		/*
		// customized project data will be stored on FS into project.json
		this.$.projectConfig.fsUpdateFile(inEvent);
		// reset the popup settings
		this.$.projectPropertiesPopup.reset();
		this.$.projectPropertiesPopup.hide();
		// generate the config.xml file
		this.$.projectPropertiesPopup.generateConfigXML(inEvent);
		 */
	},
	modifySettingsAction: function(inSender, inEvent) {
		// projectProperties popup - onTap action
		this.$.projectPropertiesPopup.show();
		// handled here (don't bubble)
		return true;
	},
	cancelSettings: function(inSender, inEvent) {
		// projectProperties popup - cancel action
		this.$.projectPropertiesPopup.hide();
		// handled here (don't bubble)
		return true;
	},
	saveGeneratedXml: function(inEvent, inSender) {
		// TODO: MADBH - need to discuss with FiX and Yves
		// config.xml needs to saved/stored under a target/phonegapbuild directory
		this.currentProject.config.saveXml(inSender.configXML);
		// handled here (don't bubble)
		return true;
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
				name: this.currentProject.name,
				filesystem: this.currentProject.service,
				folderId: this.currentProject.folderId,
				config: this.currentProject.config
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
	}
});
