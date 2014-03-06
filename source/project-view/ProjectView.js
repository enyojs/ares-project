/*global ProjectConfig, ares, ComponentsRegistry, async, enyo, Phonegap, AresI18n */

/* ilibProjectView covers Project-view specific translations. */
var ilibProjectView = AresI18n.resolve.bind(null, AresI18n.setBundle("$assets/project-view/resources")); 

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
		onAddProjectInList: "addProjectInList"
	},
	events: {
		onHideWaitPopup: "",
		onError: "",
		onProjectSelected: "",
		onRegisterMe: ""
	},
	create: function() {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.doRegisterMe({name:"projectView", reference:this});

		// i18n Checking
		this.trace("ilibProjectView: Cancel=", ilibProjectView("Cancel"));
	},
	/**
	 * Refresh the {ProjectView} (if relevant), following a change of the given file
	 * @param {Object} toSelectId. Asynchronous
	 */
	refreshFileTree: function(toSelectId,next) {
		ComponentsRegistry.getComponent("harmonia").refreshFileTree(toSelectId,next);
	},
	searchProjectsAction: function(inSender, inEvent) {
		this.$.projectWizardScan.setHeaderText(ilibProjectView("Select a folder hierarchy"));
		this.$.projectWizardScan.setRecurse(true);
		this.$.projectWizardScan.show();
		return true; //Stop event propagation
	},
	openProjectAction: function(inSender, inEvent) {
		this.$.projectWizardScan.setHeaderText(ilibProjectView("Select an existing Ares application folder (contains a project.json file)"));
		this.$.projectWizardScan.setRecurse(false);
		this.$.projectWizardScan.show();
		return true; //Stop event propagation
	},
	duplicateProjectAction: function(inSender, inEvent) {	
		if(!this.currentProject()){	
			this.doError({msg: "Please project list select item."});
			return false;
		}
		
		this.$.projectWizardCopy.start( this.currentProject() );
		return true; //Stop event propagation
	},
	createProjectAction: function(inSender, inEvent) {
		this.$.projectWizardCreate.start();
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
	currentProject: function() {
		return this.$.projectList.getSelectedProject() ;
	},
	/**
	 *
	 * @param {Object} project
	 * @param {Function} next
	 */
	setupProjectConfig: function(project, next) {
		ares.assertCb(next);

		var pname = project.getName();
		if ( this.currentProject() && pname === this.currentProject().getName() ) {
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
					self.initializeValidPgbConf(project, config.data.providers.phonegap.enabled);
					project.setConfig(config);
					
					self.initializeDownloadStatus(project, config.data.providers.phonegap.enabled);					
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
			var downloadStatus = {};
			var index = 0;

			for (index in Phonegap.UIConfiguration.platformDrawersContent) {
				downloadStatus[Phonegap.UIConfiguration.platformDrawersContent[index].id] = "Ready for download";
			}

			inProject.setDownloadStatus(downloadStatus);
		}
	},


	initializeValidPgbConf: function(inProject, inPhonegapEnabled) {
		if (inProject.getValidPgbConf() === undefined && inPhonegapEnabled) {
			var pgbValidation = {};
			var pgbUiData = Phonegap.UIConfiguration.commonDrawersContent.concat(Phonegap.UIConfiguration.platformDrawersContent);
			var index =0;

			for (index in pgbUiData) {
				//The creation of the pgbValidation drawer attribute and its initialization are done in the same time.
				pgbValidation[pgbUiData[index].id] = {};

				for (var i=0, maxLength = pgbUiData[index].rows.length; i<maxLength; i++) {
					//The creation of the pgbValidation row attribute and its initialization are done in the same time.
					pgbValidation[pgbUiData[index].id][pgbUiData[index].rows[i].name] = true;
				}
				pgbValidation[pgbUiData[index].id]["validDrawer"] = true;
			}

			inProject.setValidPgbConf(pgbValidation);
		}
	},	
	
	projectRemoved: function(inSender, inEvent) {
		ComponentsRegistry.getComponent("harmonia").setProject(null, ares.noNext);
	}
});
