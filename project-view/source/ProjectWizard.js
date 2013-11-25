/* jshint indent: false */ // TODO: ENYO-3311
/*global Ares, ares, async, ProjectConfig, ServiceRegistry */

enyo.kind({
	name: "ProjectWizardCreate",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,


	classes: "enyo-unselectable",
	events: {
		onAddProjectInList: "",
		onShowWaitPopup: "",
		onHideWaitPopup: ""
	},
	handlers: {
		onFileChosen: "prepareShowProjectPropPopup",
		onModifiedConfig: "createProject" ,
		// can be canceled by either of the included components
		onDone: "hideMe"
	},

	components: [
		{kind: "ProjectProperties", name: "propertiesWidget", onApplyAddSource: "notifyChangeSource"},
		{kind: "Ares.FileChooser", canGenerate: false, name: "selectDirectoryPopup", classes:"ares-masked-content-popup", folderChooser: true, allowCreateFolder: true, serverSelectable: false},
		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: $L("unknown error")}
	],
	debug: false,
	projectName: "",
	config: null,

	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
	},
	/**
	 * start project creation by showing direction selection widget
	 */
	start: function() {
		var dirPopup = this.$.selectDirectoryPopup ;

		this.trace("starting") ;
		this.show();

		dirPopup.$.header.setContent("Select a directory containing the new project");
		dirPopup.show();
		this.$.propertiesWidget.setDefaultTab();
		this.hide();
	},

	// Step 2: once the directory is selected by user, show the project properties popup
	// Bail out if a project.json file already exists
	prepareShowProjectPropPopup: function(inSender, inEvent) {
		this.trace("sender:", inSender, ", event:", inEvent);

		if (!inEvent.file) {
			this.config = null;
			this.hideMe();

			return;
		}

		async.series([
				this.checkProjectJson.bind(this, inSender, inEvent),
				this.fillProjectPropPopup.bind(this, inSender, inEvent),
				this.checkGetAppinfo.bind(this, inSender, inEvent),
				this.getTemplates.bind(this, inSender, inEvent),
				this.showProjectPropPopup.bind(this, inSender, inEvent)
			], this.waitOk.bind(this));
	},

	checkProjectJson: function(inSender, inEvent, next) {
		// scan content for a project.json
		var matchFileName = function(node){
			return (node.content === 'project.json' ) ;
		};
		
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;
		var nodeUpdated = hft.selectedNode.updateNodes();
		nodeUpdated.response(this, function() {
			var matchingNodes = hft.selectedNode.getNodeFiles().filter(matchFileName) ;

			if (matchingNodes.length !== 0) {
				this.hide();
				var msg = $L("Cannot create project: a project.json file already exists");
				this.$.errorPopup.raise(msg);
				this.$.selectDirectoryPopup.reset();
				next({handled: true, msg: msg});
			} else {
				next();
			}
		});
		nodeUpdated.error(this, function() {
			var msg = $L("Cannot create project: subnodes not found");
			next({handled: true, msg: msg});
		});
	},

	fillProjectPropPopup: function(inSender, inEvent, next) {
		var propW = this.$.propertiesWidget;
		this.selectedDir = inEvent.file;
		propW.setupCreate();
		propW.setTemplateList([]);		// Reset template list

		// Pre-fill project properties widget
		propW.preFill(ProjectConfig.PREFILLED_CONFIG_FOR_UI);
		propW.$.projectPathLabel.setContent($L("Project path: "));
		propW.$.projectPathValue.setContent(this.selectedDir.path);
		propW.$.projectName.setValue(this.selectedDir.name);
		propW.activateFileChoosers(false);

		next();
	},

	checkGetAppinfo: function(inSender, inEvent, next) {
		var propW = this.$.propertiesWidget;
		// scan content for an appinfo.json
		var matchFileName = function(node){
			return (node.content === 'appinfo.json' ) ;
		};
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;
		var matchingNodes = hft.selectedNode.getNodeFiles().filter(matchFileName) ;

		if (matchingNodes.length === 1) {
			this.warn("There is an appinfo.json", matchingNodes);
			var appinfoReq = this.selectedDir.service.getFile(matchingNodes[0].file.id);
			appinfoReq.response(this, function(inSender, fileStuff) {
				var info;
				try {
					info = enyo.json.parse(fileStuff.content);
				} catch(err) {
					this.hide();
					this.warn( "Unable to parse appinfo.json >>", fileStuff.content, "<<");
					var msg = this.$LS("Unable to parse appinfo.json: #{error}", {error: err.toString()});
					this.$.errorPopup.raise(msg);
					next({handled: true, msg: msg});
					return;
				}
				var conf = {};
				conf.id = info.id;
				conf.version = info.version;
				conf.title = info.title;
				propW.update(conf);
				next();
			});
			appinfoReq.error(this, function(inSender, fileStuff) {
				// Strange: network error, ... ?
				this.hide();
				var msg = $L("Unable to retrieve appinfo.json");
				this.$.errorPopup.raise(msg);
				next({handled: true, msg: msg});
			});
		} else {
			// No appinfo.json found. Or more that one which should be a bug
			next();		// Just continue
		}
	},

	/**
	 * @public
	 */
	getTemplates: function(inSender, inEvent, next) {
		return this.getSources('template', next);
	},

	/**
	 * @public
	 */
	getSources: function(type, next) {
		var propW = this.$.propertiesWidget;
		// Getting template list
		var service = ServiceRegistry.instance.getServicesByType('generate')[0];
		if (service) {
			var templateReq = service.getSources('template');
			templateReq.response(this, function(inSender, inTemplates) {
				propW.setTemplateList(inTemplates);
				next();				// Should we return immediately without waiting the answer ?
			});
			templateReq.error(this, function(inSender, inError) {
				this.warn("Unable to get template list (", inError, ")");
				this.$.errorPopup.raise($L("Unable to get template list"));
				propW.setTemplateList([]);
				next();
			});
		} else {
			this.warn("Unable to get template list (No service defined)");
			this.$.errorPopup.raise($L("Unable to get template list (No service defined)"));
			propW.setTemplateList([]);
			next();
		}
	},

	/**
	 * @param {Object} data as found in {project.json}
	 * @param {Function} next common-JS callback, when {project.json} is saved
	 * @private
	 */
	createProjectJson: function(data, next) {
		this.config = new ProjectConfig();
		this.config.service = this.selectedDir.service;
		this.config.folderId = this.selectedDir.id;
		this.config.setData(data) ;
		this.config.save(function(err) {
			this.config = null; // GC-deref
			next(err);
		});
	},

	showProjectPropPopup: function(inSender, inEvent, next) {
		var testCallBack = inEvent.testCallBack;
		// once project.json is created, setup and show project properties widget
		this.$.selectDirectoryPopup.hide();
		this.$.selectDirectoryPopup.reset();
		this.show() ;
		if (testCallBack) {
			testCallBack();
		}
		next();
	},

	waitOk:function(err, results) {
		if (err) {
			var showError = true;
			if (err.handled && (err.handled === true)) {
				showError = false;
			}

			if (showError) {
				this.config = null;
				this.hideMe();
				this.warn("An error occured: ", err);
				this.$.errorPopup.raise(err.msg);
			}
		}
		// Else: nothing to do
	},

	// step 3: actually create project in ares data structure
	createProject: function (inSender, inEvent, next) {
		this.projectName = inEvent.data.name;
		var folderId = this.selectedDir.id ;
		var template = inEvent.template;
		var addedSources = inEvent.addedSources.length !==0 ? true : false;

		this.trace("Creating new project ", name, " in folderId=", folderId, " (template: ", template, ")");

		if (template || addedSources) {
			this.instanciateTemplate(inEvent);
		} 
		if (!template) {
			var service = this.selectedDir.service;
			service.createFile(folderId, "package.js", "enyo.depends(\n);\n")
				.response(this, function(inRequest, inFsNode) {
					this.trace("package.js inFsNode[0]:", inFsNode[0]);
					var callback = (function(){
						if (!addedSources){
							this.projectReady(null, inEvent);
						} else {
							this.projectRefresh();
						}
					}).bind(this);

					this.createProjectJson(inEvent.data, callback);
				})
				.error(this, function(inRequest, inError) {
					this.warn("inRequest:", inRequest, "inError:", inError);
				});
		}
		return true ; // stop bubble
	},
	/** @private */
	$LS: function(msg, params) {
		var tmp = new enyo.g11n.Template($L(msg));
		return tmp.evaluate(params);
	},
	// step 4: populate the project with the selected template
	instanciateTemplate: function (inEvent) {

		var sources = [];
		var template = inEvent.template;
		var addedSources = inEvent.addedSources || [];
		this.doShowWaitPopup({msg: this.$LS("Creating project from #{template}", {template: template})});

		var substitutions = [{
			fileRegexp: "appinfo.json",
			json: {
				id: inEvent.data.id,
				version: inEvent.data.version,
				title: inEvent.data.title
			}
		}];

		var genService = ServiceRegistry.instance.getServicesByType('generate')[0];
		sources.push(template);
		addedSources.forEach(function(source) {
			sources.push(source);
		});
		var req = genService.generate({
			sourceIds: sources,
			substitutions: substitutions
		});
		req.response(this, function(inSender, inData) {
			var callback = (function(){
				this.populateProject(inSender, inData);	
			}).bind(this);

			this.createProjectJson(inEvent.data, callback);			
		});
		req.error(this, function(inSender, inError) {
			this.warn("Unable to get the template files (", inError, ")");
			this.$.errorPopup.raise($L("Unable to instanciate projet content from the template"));
			this.doHideWaitPopup();
		});
	},

	// step 5: populate the project with the retrieved template files
	populateProject: function(inSender, inData) {
		var folderId = this.selectedDir.id;
		var service = this.selectedDir.service;

		// Copy the template files into the new project
		var req = service.createFiles(folderId, {content: inData.content, ctype: inData.ctype});
		req.response(this, this.projectReady);
		req.error(this, function(inEvent, inError) {
			this.$.errorPopup.raise($L("Unable to create projet content from the template"));
			this.doHideWaitPopup();
		});
	},

	// step 6: we're done
	projectReady: function(inSender, inData) {
		this.doAddProjectInList({
			name: this.projectName,
			folderId: this.selectedDir.id,
			service: this.selectedDir.service
		});
	},
	
	projectRefresh: function(inSender, inData) {
		this.owner.setupProjectConfig(this.targetProject);
		this.hideMe();
	},
	/**
	 * Hide the whole widget. Typically called when ok or cancel is clicked
	 */
	hideMe: function() {
		this.$.selectDirectoryPopup.hide();
		this.$.selectDirectoryPopup.reset();
		this.hide() ;
		return true;
	}
});

/**
 * This kind handles the project modifications treatment (extracted from ProjectView)
 */
enyo.kind({
	name: "ProjectWizardModify",

	kind: "onyx.Popup",
	modal: true, centered: true, floating: true, autoDismiss: false,

	handlers: {
		onDone: "hide",
		onModifiedConfig: "saveProjectConfig",
		onModifiedSource: "populateProject",
		onSelectFile: "selectFile",
		onCheckPath: "checkPath",
		onPathChecked: "pathChecked"
	},
	classes:"ares-masked-content-popup",
	components: [
		{kind: "ProjectProperties", name: "propertiesWidget", onApplyAddSource: "notifyChangeSource", onFileChoosersChecked: "fileChoosersChecked"},
		{name: "selectFilePopup", kind: "Ares.FileChooser", classes:"ares-masked-content-popup", showing: false, folderChooser: false, allowToolbar: false, onFileChosen: "selectFileChosen"}
	],

	debug: false,
	targetProject: null,
	chooser: null,
	checker: null,
	displayedTab: null,

	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
	},
	/**
	 * Step 1: start the modification by showing project properties widget
	 */
	start: function(target) {
		if (target) {
			var config = target.getConfig();
			
			this.targetProject = target ;
			this.$.propertiesWidget.setTargetProject(target);		
		

			this.$.propertiesWidget.setupModif();
			this.$.propertiesWidget.preFill(config.data);

			this.$.propertiesWidget.$.projectPathLabel.setContent($L("Project path: "));
			this.$.propertiesWidget.$.projectPathValue.setContent("");
			
			var req = config.service.propfind(config.folderId, 3);
			req.response(this, function(inSender, inFile) {
				this.$.propertiesWidget.$.projectPathValue.setContent(inFile.path);
			});
			
			this.$.propertiesWidget.activateFileChoosers(true);
			this.$.propertiesWidget.checkFileChoosers();			
		}
	},
	
	/**
	 * Function used to display the Edit Pop-up with the specification of the defaut tab to be displayed
	 * @param  {Object} target         Object contains meta-data of the selected project.
	 * @param  {in} inDisplayedTab index of the defaut displayed tab (0: Project, 1: Preview, 2: Phonegap Build)
	 * @private
	 */
	showEditPopUp: function(target, inDisplayedTab) {
		if(target) {
			this.start(target);

			// Pass the configuration of the selected project to the panel "Phonegap Build"
			if (this.$.propertiesWidget.$.phonegapDrawer) {
				this.$.propertiesWidget.$.phonegapDrawer.$.phonegap.setProject(target);
			}

			// Define the tab that will be shown when the Pop-up is displayed
			this.displayedTab = inDisplayedTab;
		}
	},

	// step 2:
	saveProjectConfig: function(inSender, inEvent) {
		this.trace("saving project config");

		if (! this.targetProject) {
			this.warn("internal error: saveProjectConfig was called without a target project.") ;
			return true ; // stop bubble
		}

		// Save the data to project.json
		var config = this.targetProject.getConfig();
		config.setData(inEvent.data);
		config.save();

		// selected project name was modified
		if (inEvent.data.name !== this.targetProject.getName()) {
			// project name has changed, update project model list
			var oldName = this.targetProject.getName();
			Ares.Workspace.projects.renameProject(oldName, inEvent.data.name);
		}

		return true ; // stop bubble
	},
	/** @private */
	selectFile: function(inSender, inData) {
		this.trace(inSender, "=>", inData);
		
		this.chooser = inData.input;
		this.$.selectFilePopup.reset();
		this.$.selectFilePopup.connectProject(this.targetProject, (function() {
			this.$.selectFilePopup.setHeaderText(inData.header);
			this.$.selectFilePopup.pointSelectedName(inData.value, inData.status);
			this.$.selectFilePopup.show();
		}).bind(this));

		return true;
	},
	/** @private */
	selectFileChosen: function(inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		
		var chooser = this.chooser;
		this.chooser = null;

		if (!inEvent.file) {
			// no file or folder chosen			
			return true;
		}

		this.$.propertiesWidget.updateFileInput(chooser, inEvent.name);
		this.$.selectFilePopup.reset();
		return true;
	},
	populateProject: function(inSender, inData) {
		var selectedDir = this.targetProject.getConfig();
		var folderId = selectedDir.folderId;
		var service = selectedDir.service;

		// Copy the template files into the new project
		var req = service.createFiles(folderId, {content: inData.content, ctype: inData.ctype});
		req.response(this, this.projectRefresh);
		req.error(this, function(inEvent, inError) {
			this.$.errorPopup.raise($L("Unable to create projet content from the template"));
			this.doHideWaitPopup();
		});
		return true;
	},
	projectRefresh: function(inSender, inData) {
		this.owner.setupProjectConfig(this.targetProject);
		this.hideMe();
	},

	/**
	 * Hide the whole widget. Typically called when ok or cancel is clicked
	 */
	hideMe: function() {
		this.config = null ; // forget ProjectConfig object
		this.hide() ;
		return true;
	},
	/** @private */
	checkPath: function (inSender, inData) {
		this.trace(inSender, "=>", inData);
		
		this.checker = inData.input;
		
		// FIXME ENYO-2761: this is a workaround that shows the developer that the path is not
		// valid because it doesn't begin with an "/".
		if (inData.value.indexOf("/") !== 0) {
			this.pathChecked(inSender, {status: false});
			return true;
		}

		this.$.selectFilePopup.connectProject(this.targetProject, (function() {
			this.$.selectFilePopup.checkSelectedName(inData.value);
		}).bind(this));		
	},
	/** @private */
	pathChecked: function (inSender, inData) {
		this.trace(inSender, "=>", inData);
		
		var checker = this.checker;
		this.checker = null;

		this.$.selectFilePopup.reset();
		this.$.propertiesWidget.updatePathCheck(checker, inData.status);
	},
	/** @private */
	fileChoosersChecked: function (inSender, inEvent) {
		this.trace(inSender, "=>", inEvent);
		this.show();

		if (this.displayedTab) {
			this.$.propertiesWidget.setDisplayedTab(this.displayedTab);
		} else {
			this.$.propertiesWidget.setDefaultTab();
		}
		
		return true;
	}
	
});


/**
 * This kind will scan a directory. It will create a new project for each project.json found.
 */
enyo.kind({
	name: "ProjectWizardScan",
	kind: "Ares.FileChooser",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,
	folderChooser: true,

	classes: "enyo-unselectable",
	events: {
		onAddProjectInList: "",
		onError: "",
		onShowWaitPopup: "",
		onHideWaitPopup: ""
	},
	handlers: {
		onFileChosen: "searchProjects"
	},
	debug: false,
	projects: 0,

	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
	},

	/** @public */
	importProject: function(service, parentDir, child) {
		this.trace('importing project from folder ', parentDir.name ) ;
		throw new Error("Not implemented - XXX ENYO-3543");
	},

	/**
	 * Open an existing project
	 *
	 * Load the project from the given folder & requests Ares to
	 * add it to the list of the known projects
	 *
	 * @param {FileSystemService} service is the file-system
	 * @param {ares.Filesystem.Node} folderNode is the folder node
	 * @param {ares.Filesystem.Node} [projectNode] is the <pre>project.json</pre> node
	 * @public
	 */
	openProject: function(service, folderNode, projectNode, next) {
		this.trace('opening project.json from ', folderNode.name ) ;
		async.waterfall([
			_list.bind(this),
			_fetch.bind(this),
			_load.bind(this)
		], next);

		function _list(next) {
			if (projectNode && projectNode.id) {
				next(null, projectNode);
			} else {
				var req = service.propfind(folderNode.id, 1 /*depth*/);
				req.response(this, function(inSender, inResponse) {
					this.trace(inResponse);
					projectNode = inResponse.children.filter(function(child) {
						return child.name === "project.json";
					})[0];
					next(null, projectNode);
				});
				req.error(_handleError);
			}
		}

		function _fetch(projectNode, next) {
			var req = service.getFile(projectNode.id);
			req.error(_handleError);
			req.response(function(inSender, fileStuff) {
				next(null, fileStuff);
			});
		}

		function _load(fileStuff, next) {
			var projectData;
			try {
				this.trace( "file contents: '", fileStuff.content, "'" ) ;
				projectData = enyo.json.parse(fileStuff.content)  ;
				this.trace('Opened project ', projectData && projectData.name, " from ", folderNode.path) ;
				this.doAddProjectInList({
					name: (projectData && projectData.name) || folderNode.name,
					folderId: folderNode.id,
					service: service
				});
				next();
			} catch(e) {
				this.warn("Error parsing project data: ", e.toString());
				next(e);
			}
		}

		function _handleError(inSender, inError) {
			this.warning(inError);
			next(new Error(inError.toString()));
		}
	},

	/**
	 * Search for Ares projects in the currently selected folder
	 * @param {Object} inSender
	 * @param {Object} inEvent
	 * @public
	 */
	searchProjects: function (inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);

		if (!inEvent.file) {
			this.hide();
			this.reset();
			return;
		}

		var service = inEvent.file.service;
		var topDir = this.$.hermesFileTree.selectedNode.file ;
		var projects = [];
		var next = (typeof inEvent.next === 'function' && inEvent.next) || function() {};

		async.series([
			_walk.bind(this, topDir),
			_add.bind(this),
			_finish.bind(this)
		], next);

		function _walk(folderNode, next) {
			this.trace('Searching in ', folderNode.path) ;
			this.doShowWaitPopup({msg: "Scanning: " + folderNode.name + "..."});
			var req = service.listFiles(folderNode.id);
			req.response(this, function(inSender, inFiles) {
				// First look for a `project.json`...
				var fileNode = enyo.filter(inFiles, function(v) {
					return v.name === 'project.json';
				}, this)[0];
				if (fileNode) {
					this.trace('Found:', fileNode.path) ;
					this.doShowWaitPopup({msg: "Found: " + folderNode.name + "..."});
					projects.push({
						folder: folderNode,
						file: fileNode
					});
					next();
				} else {
					// ... and recurse only if
					// none if found in the
					// children.
					var subDirs = enyo.filter(inFiles, function(file) {
						return file.isDir;
					});
					async.forEachSeries(subDirs, _walk.bind(this), next);
				}
			});
		}

		function _add(next) {
			this.trace('Adding found projects:', projects) ;
			async.forEachSeries(projects, (function(project, next) {
				this.doShowWaitPopup({msg: "Adding: " + project.folder.name + " ..."});
				this.openProject(service, project.folder, project.file, next);
			}).bind(this), next);
		}

		function _finish(next) {
			this.doHideWaitPopup();
			this.reset();
		}
	}
});

enyo.kind({
	name: "ProjectWizardCopy",

	kind: "onyx.Popup",
	modal: true, centered: true, floating: true, autoDismiss: false,

	handlers: {
		onDone: "hide",
		onModifiedConfig: "copyProject"
	},
	events: {
		onError: "",
		onShowWaitPopup: "",
		onHideWaitPopup: ""
	},
	components: [
		{kind: "ProjectProperties", name: "propertiesWidget"}
	],

	debug: false,
	targetProject: null,

	create: function() {
		ares.setupTraceLogger(this);	// Setup this.trace() function according to this.debug value
		this.inherited(arguments);
	},
	/**
	 * Step 1: start the modification by showing project properties widget
	 */
	start: function(target) {
		if (target) {
			var data = enyo.clone(target.getConfig().data);
			// TODO: Verify that the project name and dir does not exist
			data.name = data.name + "-Copy";

			this.targetProject = target;
			this.$.propertiesWidget.setupModif() ;
			this.$.propertiesWidget.preFill(data);

			this.$.propertiesWidget.$.projectPathLabel.setContent($L("Parent project path: "));
			this.$.propertiesWidget.$.projectPathValue.setContent("");
			var config = target.getConfig();
			var req = config.service.propfind(config.folderId, 3);
			req.response(this, function(inSender, inFile) {
				var parentFolderPath = inFile.path.slice(0, -(inFile.name.length));
				this.$.propertiesWidget.$.projectPathValue.setContent(parentFolderPath);
			});

			this.$.propertiesWidget.activateFileChoosers(false);
			this.show();
		}
	},

	// step 2:
	copyProject: function(inSender, inEvent) {
		this.trace("Copying project", this.targetProject.getConfig().data.name);
		this.doShowWaitPopup({msg: "Duplicating project"});

		var service = this.targetProject.getService();
		var folderId = this.targetProject.getFolderId();
		this.newConfigData = inEvent.data;

		var destination = inEvent.data.name;
		var known = Ares.Workspace.projects.get(destination);
		if (known) {
			this.doError({msg: this.$LS("Unable to duplicate the project, the project '#{destination}' already exists", {destination: destination})});
			return true ; // stop bubble			
		}

		var req = service.copy(folderId, {name: destination});
		req.response(this, this.saveProjectJson);
		req.error(this, function(inSender, status) {
			var msg = $L("Unable to duplicate the project");
			if (status === 412 /*Precondition-Failed*/) {
				this.warn("Unable to duplicate the project, directory '", destination, "' already exists", status);
				msg = this.$LS("Unable to duplicate the project, directory '#{destination}' already exists", {destination: destination});
			} else {
				this.warn("Unable to duplicate the project", status);
			}
			this.doError({msg: msg});
		});

		return true ; // stop bubble
	},
	saveProjectJson: function(inSender, inData) {
		this.trace(inData);
		var folderId = inData.id;
		this.newFolderId = folderId;
		var service = this.targetProject.getService();
		var fileId;
		enyo.forEach(inData.children, function(entry) {
			if (entry.name === "project.json") {
				fileId = entry.id;
			}
		});

		if (! fileId) {
			this.warn("Unable to duplicate the project, no 'project.json' found", inData);
			this.doError({msg: $L("Unable to duplicate the project, no 'project.json' found")});
			return;
		}

		var req = service.putFile(fileId, enyo.json.stringify(this.newConfigData, null, 2));
		req.response(this, this.createProjectEntry);
		req.error(this, function(inSender, inError) {
			this.warn("Unable to duplicate the project, unable to update 'project.json'", inError);
			this.doError({msg: $L("Unable to duplicate the project, unable to update 'project.json'")});
		});
	},
	createProjectEntry: function(inSender, inData) {
		this.trace(inData);
		var serviceId = this.targetProject.getServiceId();
		// Create the project entry in the project list
		var project = Ares.Workspace.projects.createProject(this.newConfigData.name, this.newFolderId, serviceId);
		if(project){
			this.owner.$.projectList.selectInProjectList(project);
		}
		this.doHideWaitPopup();
	},
	$LS: function(msg, params) {
		var tmp = new enyo.g11n.Template($L(msg));
		return tmp.evaluate(params);
	}
});
