/*global enyo, Ares, ares, async, ProjectConfig, ServiceRegistry, ilibProjectView */

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
		onFileChosen: "_folderSelectedAction",
		onModifiedConfig: "createProject" ,
		// can be canceled by either of the included components
		onDone: "hideMe"
	},

	published: {
		projectHermesNode: "",
		projectFiles: ""
	},

	components: [
		{kind: "ProjectProperties", name: "propertiesWidget", onApplyAddSource: "notifyChangeSource"},
		{kind: "Ares.FileChooser", header: ilibProjectView("Select a directory containing the new project"), canGenerate: false, name: "selectDirectoryPopup", classes:"ares-masked-content-popup", folderChooser: true, allowCreateFolder: true, serverSelectable: false},
		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: ilibProjectView("unknown error")},
		{kind: "Ares.ActionPopup", name: "confirmOverwriteOrLoadPopup", title: ilibProjectView("Non-empty folder"), message: ilibProjectView("Use existing folder content or overwrite it?"), actionButton: ilibProjectView("Overwrite"), onConfirmActionPopup: "_confirmedOverwriteAction", action1Button: ilibProjectView("Use"), onConfirmAction1Popup: "_confirmedUseAction", cancelButton: ilibProjectView("Cancel")}
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
		this.projectHermesNode = null;
		this.projectFiles = {};

		this.show();
		this.$.propertiesWidget.setDefaultTab();
		this.hide();
		this._selectFolder();
	},

	_selectFolder: function() {
		this.trace();
		this.$.selectDirectoryPopup.show();
	},

	_folderSelectedAction: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
		this.projectHermesNode = this.$.selectDirectoryPopup.$.hermesFileTree.selectedNode;
		if (this.projectHermesNode) {
			var req = this.projectHermesNode.updateNodes();
			req.response(this, function() {
				var projectNodes = this.projectHermesNode.getNodeFiles();
				enyo.forEach(projectNodes, function(node) {
					this.projectFiles[node.content] = node.file;
				}, this);
				
				if (enyo.keys(this.projectFiles).length > 0) {
					this.$.confirmOverwriteOrLoadPopup.show();
				} else {
					this._createProject();
				}
			});
			req.error(this, function(inSender, inError) {
				this._waitOk(new Error(inError.toString()));
			});
		}
		return true;
	},

	_confirmedUseAction: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
		this._loadProject();
	},

	_confirmedOverwriteAction: function(inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
		this._createProject();
	},
	
	_loadProject: function() {
		this.trace();
		var conf = ares.clone(ProjectConfig.PREFILLED_CONFIG_FOR_UI);

		async.waterfall([
			_loadProjectJson.bind(this, conf),
			_loadAppInfoJson.bind(this), // XXX move into webOS plugin
			this._fillProjectPropPopup.bind(this, false /*isCreation*/),
			this._showProjectPropPopup.bind(this)
		], this._waitOk.bind(this));

		function _loadProjectJson(conf, next) {
			var file = this.projectFiles['project.json'];
			if (!file) {
				next(null, conf);
			} else {
				var req = this.projectHermesNode.service.getFile(file.id);
				req.response(this, function(inSender, inResponse) {
					try {
						conf = ares.extend(conf, enyo.json.parse(inResponse.content));
						next(null, conf);
					} catch(err) {
						//req.fail(new Error("Unable to parse 'project.json'"));
						this.warn(new Error("Unable to parse 'project.json', skipping it..."));
						next(null, conf);
					}
				});
				req.error(this, function(inSender, inError) {
					next(new Error(inError.toString));
				});
			}
		}
		
		function _loadAppInfoJson(conf, next) {
			var file = this.projectFiles['appinfo.json'];
			if (!file) {
				next(null, conf);
			} else {
				var req = this.projectHermesNode.service.getFile(file.id);
				req.response(this, function(inSender, inResponse) {
					try {
						var appinfo = enyo.json.parse(inResponse.content);
						conf.id = appinfo.id || conf.id;
						conf.version = appinfo.version || conf.version;
						conf.title = appinfo.title || conf.title;
						next(null, conf);
					} catch(err) {
						//req.fail(new Error("Unable to parse 'appinfo.json'"));
						this.warn(new Error("Unable to parse 'appinfo.json', skipping it..."));
						next(null, conf);
					}
				});
				req.error(this, function(inSender, inError) {
					next(new Error(inError.toString));
				});
			}
		}
	},

	/**
	 * Set the frame to create a new project.
	 * Start from the selection of a project creation action, & finish when
	 * the Project wizard pop-up is displayed.
	 * 
	 * @private.
	 */
	_createProject: function() {
		this.trace();
		var conf = ares.clone(ProjectConfig.PREFILLED_CONFIG_FOR_UI);

		async.waterfall([
			this._fillProjectPropPopup.bind(this, true /*isCreation*/, conf),
			this._getSources.bind(this, 'template'),
			this._showProjectPropPopup.bind(this)
		], this._waitOk.bind(this));
	},

	
	/**
	 * Initialize the project's directory instance & the configuration for the Project properties
	 * View.
	 * 
	 * @param  {Boolean}  isCreation Specify wether if it's a creation or an edition of the project.
	 * @param  {Object}   conf       The prefilled configuration of the project.
	 * @param  {Function} next       CommonJs callback.
	 * @Private
	 */
	_fillProjectPropPopup: function(isCreation, conf, next) {
		this.trace("conf:", conf);
		var propW = this.$.propertiesWidget;
		this.selectedDir = this.projectHermesNode.file;
		if (isCreation) {
			propW.setupCreate();
		} else {
			propW.setupModif();
		}

		// Pre-fill project properties widget
		propW.preFill(conf);
		propW.$.projectPathLabel.setContent(ilibProjectView("Project path: "));
		propW.$.projectPathValue.setContent(this.selectedDir.path);
		propW.$.projectName.setValue(this.selectedDir.name);
		propW.activateFileChoosers(false);

		next();
	},

	/**
	 * Send a request to the ServiceRegistery in order to initialize the service instance.
	 * 
	 * @param  {String}   type [description]
	 * @param  {Function} next CommonJs callback
	 * @private
	 */
	_getSources: function(type ,next) {
		this.trace("type:", type);
		var propW = this.$.propertiesWidget;
		// Getting template list
		var service = ServiceRegistry.instance.getServicesByType('generate')[0];
		if (service) {
			var req = service.getSources(type);
			req.response(this, function(inSender, inResponse) {
				propW.setTemplateList(inResponse);
				next();
			});
			req.error(this, function(inSender, inError) {
				next(new Error("Unable to get list for type: " + type + " (" + inError.toString() + ")"));
			});
		} else {
			next(new Error("No application templating service ('generate')) defined"));
		}
	},

	/**
	 * Display the Project wizard pop-up.
	 * 
	 * @param  {Function} next CommonJs callback
	 * @private
	 */
	_showProjectPropPopup: function(next) {
		this.$.selectDirectoryPopup.hide();
		this.$.selectDirectoryPopup.reset();
		this.$.propertiesWidget.hideVersions();
		this.show();
		next();
	},

	/**
	 * Display an error pop-up in the case where an exception occurs.
	 * 
	 * @param  {Object} err error instance.
	 * @private
	 */
	_waitOk:function(err) {
		this.trace("err:", err);
		this.doHideWaitPopup();
		if (err) {
			this.hideMe();
			this.warn("An error occured: ", err);
			this.$.errorPopup.raise(err.toString());
		}
	},

	// step 3: actually create project in ares data structure
	createProject: function (inSender, inEvent) {
		this.trace("inSender:", inSender, "inEvent:", inEvent);
		var conf = inEvent.data;
		this.projectName = conf.name;
		var folderId = this.selectedDir.id ;
		var template = inEvent.template;
		var addedSources = inEvent.addedSources.length !==0 ? true : false;

		this.trace("Creating new project ", this.projectName, " in folderId=", folderId, " (template: ", template, ")");

		async.waterfall([
			this.createProjectJson.bind(this, conf),
			this.instanciateTemplate.bind(this, template, addedSources, conf),
			this.populateProject.bind(this),
			this.projectReady.bind(this)
		], this._waitOk.bind(this));

		return true ; // stop bubble
	},

	/**
	 * @param {Object} data as found in {project.json}
	 * @param {Function} next common-JS callback, when {project.json} is saved
	 * @private
	 */
	createProjectJson: function(data, next) {
		var config = new ProjectConfig();
		config.service = this.selectedDir.service;
		config.folderId = this.selectedDir.id;
		config.setData(data) ;
		config.save(next);
	},

	// step 4: populate the project with the selected template
	instanciateTemplate: function (template, addedSources, conf, next) {
		this.trace("template:", template, "addedSources:", addedSources, "conf:", conf);
		if (!template) {
			next(null, null);
			return;
		}
		var sources = [];
		this.doShowWaitPopup({msg: ilibProjectView("Creating project from template '{template}'.", {template: template})});

		// XXX webOS-specific substitution
		var substitutions = [{
			fileRegexp: "appinfo.json",
			json: {
				id: conf.id,
				version: conf.version,
				title: conf.title
			}
		}];

		var genService = ServiceRegistry.instance.getServicesByType('generate')[0];
		sources.push(template);
		(addedSources || []).forEach(function(source) {
			sources.push(source);
		});
		var req = genService.generate({
			sourceIds: sources,
			substitutions: substitutions
		});
		req.response(this, function(inSender, inData) {
			var propW = this.$.propertiesWidget;
			propW.setTemplateList([]);
			this.trace("generate response:", inData);
			next(null, inData);
		});
		req.error(this, function(inSender, inError) {
			var err = new Error("Unable to instanciate projet content from the template '" + template + "': " + inError.toString());
			next(err);
		});
	},

	// step 5: populate the project with the retrieved template files
	populateProject: function(inData, next) {
		this.trace("inData:", inData);
		if (!inData) {
			next();
			return;
		}

		var folderId = this.selectedDir.id;
		var service = this.selectedDir.service;

		// Copy the template files into the new project
		var req = service.createFiles(folderId, {content: inData.content, ctype: inData.ctype});
		req.response(this, function(inSender, inData) {
			next();
		});
		req.error(this, function(inEvent, inError) {
			var err = new Error("Unable to create projet content from the template (" + inError.toString() + ")");
			next(err);
		});
	},

	// step 6: we're done
	projectReady: function(next) {
		this.trace();
		this.doAddProjectInList({
			name: this.projectName,
			folderId: this.selectedDir.id,
			service: this.selectedDir.service
		});
		next();
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
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

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
	versions: [],

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
			var serviceConfig = config.service.config;
			var home = serviceConfig.origin+serviceConfig.pathname+"/file";
	
			this.targetProject = target ;
			this.$.propertiesWidget.setTargetProject(target);		
			

			this.$.propertiesWidget.setupModif();
			this.$.propertiesWidget.preFill(config.data);

			this.$.propertiesWidget.$.projectPathLabel.setContent(ilibProjectView("Project path: "));
			this.$.propertiesWidget.$.projectPathValue.setContent("");
			
			var req = config.service.propfind(config.folderId, 3);
			req.response(this, function(inSender, inFile) {
				this.$.propertiesWidget.$.projectPathValue.setContent(inFile.path);
				//read path to version's file from deploy.json file
				this.readDeployFile(inFile.path, home);
			});
			this.$.propertiesWidget.activateFileChoosers(true);
			this.$.propertiesWidget.checkFileChoosers();			
		}
	},
	/**
	 * @private
	 * Read deploy.json file
	 * @param {String} pathProject, path to project
	 * @param {String} urlHome, home url
	 */
	readDeployFile: function(pathProject, urlHome){
		var url = urlHome + pathProject + "/deploy.json";
		var req = new enyo.Ajax({url: url, handleAs: "json"});
		req.response(this, function(inSender, inValue) {
			this.searchForVersions(inValue, pathProject, urlHome);
		});
		req.error(this, function(err){
			this.searchForVersions(null, pathProject, urlHome);
		});
		req.go();
	},
	/**
	 * @private
	 * Read version.js files for enyo and other libs
	 * @param {Object} pathDeploy, paths read from deploy.json file
	 * @param {String} pathProject, path to project
	 * @param {String} urlHome, home url
	 */
	searchForVersions: function(pathDeploy, pathProject, urlHome){
		this.trace(pathDeploy, pathProject, urlHome);
		var	pathArray = [],
			urls = [],
			urlObject = {},
			serviceHome = urlHome+pathProject,
			enyoVersionFile = "/source/boot/version.js",
			versionFile = "/version.js",
			parrallelReads = [];

		//define the default path to use if the deploy.json file doesn't exists
		if(!pathDeploy){
			// doesn't work for added libs
			pathDeploy = {enyo: "./enyo", libs: ["./lib/onyx", "./lib/layout"]};
		}

		pathArray.push(pathDeploy["enyo"]);
		enyo.forEach(pathDeploy["libs"], function(path){
			pathArray.push(path);
		}, this);
		
		enyo.forEach(pathArray, function(path){
			if(path){
				//a path can be started with ./ or nothing
				path = path.replace(/^\.\//, ""); //if the path starts with ./, it is replaced by nothing
				var lib = path.replace(/^lib\//, "");
				urlObject = {"lib" : lib, "url": serviceHome + "/" + path + (path.match(/^enyo/) ? enyoVersionFile : versionFile)};
				urls.push(urlObject);
			}
		}, this);

		this.trace("found urls", urls);

		if(urls.length){
			this.versions = [];
			enyo.forEach(urls, function(url){
				var readFunction = this.readVersionFileFromUrl.bind(this,url);
				parrallelReads.push(readFunction);
			}, this);

			async.parallel(parrallelReads, this.setVersionLabel.bind(this));
		}
	},
	/**
	 * @private
	 * Read file's content from a url
	 * @param {String} url, url for version.js file 
	 * @param {[Function]} next
	 */
	readVersionFileFromUrl: function(url, next){
		var req = new enyo.Ajax({url: url["url"], handleAs: "text"});
		var content = "";
		var version = "";
		var expr = new RegExp("enyo.version.|=|:|\"", "g");

		req.response(this, function(inSender, inValue) {
			if(inValue){
				content = inValue.match(/{\s*(enyo[^\n,;]+)/);
				version = content[1].replace(expr, "").replace(/[\w\.]+/,"$&:");
				this.versions.push(version);
			}
			next();
		});
		req.error(this, function(err){
			this.versions.push( url["lib"]+ ": not found");
			next();
		});
		req.go();
	},

	/**
	 * Display version label
	 */
	setVersionLabel: function(){
		this.versions.sort(this.compareLibs);
		this.$.propertiesWidget.setVersionLabel(this.versions.join(", "));
	},

	/**
	 * @private
	 * Used to set the enyo version at the top of the array
	 * @param {String} libA
	 * @param {String} libB
	 */
	compareLibs: function (libA, libB){
		var re = new RegExp("^enyo:");
		if(libA.match(re) && libB.match(re)){
			return 0;
		} else if (libA.match(re)) {
			return -1;
		} else if (libB.match(re)) {
			return 1;
		}
		return 0;
	},
	/**
	 * @private
	 * Add content to version repeater item
	 */
	addVersions: function(inSender, inEvent){
		var item = inEvent.item.$.item,
			index = inEvent.item.index;
		item.setContent(this.versions[index]);
		return true;
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
		this.trace("inData:", inData);
		var selectedDir = this.targetProject.getConfig();
		var folderId = selectedDir.folderId;
		var service = selectedDir.service;

		// Copy the template files into the new project
		var req = service.createFiles(folderId, {content: inData.content, ctype: inData.ctype});
		req.response(this, this.projectRefresh);
		req.error(this, function(inEvent, inError) {
			this.$.errorPopup.raise(ilibProjectView("Unable to create projet content from the template"));
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
	//serverSelectable: false,
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
	published: {
		recurse: true
	},
	debug: false,

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
					service: service,
					dontSelect: true // do not open projects found by search
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

		if (!inEvent.file || !inEvent.file.service) {
			this.hide();
			this.reset();
			return;
		}

		var service = inEvent.file.service;
		var topDir = this.$.hermesFileTree.selectedNode.file ;
		var projects = [];

		async.series([
			_walk.bind(this, topDir),
			_add.bind(this),
			_finish.bind(this)
		], _next.bind(this));

		/**
		 * Scan the sub-directories of the selected folder :
		 * If the sub-directory contains the "project.json" 
		 * then the directory reference is pushed in the projects list.
		 * 
		 * Otherwise it will look into the value of the attribute "recurse"
		 * to see if wether or not a recursion should be done on the childrens
		 * of the sub-directory.
		 * 
		 * @param  {Object}   folderNode describe the file node
		 * @param  {Function} next       CommonJs callback.
		 */
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
				} else if (!this.recurse) {
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
			this.reset();
			next();
		}

		function _next(err) {
			
			this.doHideWaitPopup();
			
			if(projects.length === 0) {
				var msg = this.recurse ? "Did not find any project in the directory (no project.json found)"
						: "This folder can't be opened as a project. Project.json file not found.";
				this.doError({msg: msg});
				this.trace(msg);
			}
			
			if (err) {
				this.warn("Unable to open project:", err);
				if (!this.recurse) {
					this.doError({msg: "Unable to open project", err: err});
				}
			}
		}
	}
});

enyo.kind({
	name: "ProjectWizardCopy",

	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

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

			this.$.propertiesWidget.$.projectPathLabel.setContent(ilibProjectView("Parent project path: "));
			this.$.propertiesWidget.$.projectPathValue.setContent("");
			//TO DO: hide versions label for copy not tested, copy isn't working
			this.$.propertiesWidget.hideVersions();
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
		this.doShowWaitPopup({msg: ilibProjectView("Duplicating project")});

		var service = this.targetProject.getService();
		var folderId = this.targetProject.getFolderId();
		this.newConfigData = inEvent.data;

		var destination = inEvent.data.name;
		var known = Ares.Workspace.projects.get(destination);
		if (known) {
			this.doError({msg: ilibProjectView("Unable to duplicate the project, the project '{destination}' already exists", {destination: destination})});
			return true ; // stop bubble			
		}

		var req = service.copy(folderId, {name: destination});
		req.response(this, this.saveProjectJson);
		req.error(this, function(inSender, status) {
			var msg = ilibProjectView("Unable to duplicate the project");
			if (status === 412 /*Precondition-Failed*/) {
				this.warn("Unable to duplicate the project, directory '", destination, "' already exists", status);
				msg = ilibProjectView("Unable to duplicate the project, directory '{destination}' already exists", {destination: destination});
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
			this.doError({msg: ilibProjectView("Unable to duplicate the project, no 'project.json' found")});
			return;
		}

		var req = service.putFile(fileId, enyo.json.stringify(this.newConfigData, null, 2));
		req.response(this, this.createProjectEntry);
		req.error(this, function(inSender, inError) {
			this.warn("Unable to duplicate the project, unable to update 'project.json'", inError);
			this.doError({msg: ilibProjectView("Unable to duplicate the project, unable to update 'project.json'")});
		});
	},
	createProjectEntry: function(inSender, inData) {
		this.trace(inData);
		var serviceId = this.targetProject.getServiceId();
		// Create the project entry in the project list
		var project = Ares.Workspace.projects.createProject(this.newConfigData.name, this.newFolderId, serviceId);
		if(project){
			this.owner.$.projectList.selectProject(project, ares.noNext);
		}
		this.doHideWaitPopup();
	}
});
