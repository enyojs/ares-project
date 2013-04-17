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
		{kind: "ProjectProperties", name: "propertiesWidget"},
		{kind: "Ares.FileChooser", canGenerate: false, name: "selectDirectoryPopup", folderChooser: true},
		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"}
	],
	debug: false,
	projectName: "",

	/**
	 * start project creation by showing direction selection widget
	 */
	start: function() {
		var dirPopup = this.$.selectDirectoryPopup ;

		if (this.debug) this.log("starting") ;
		this.show();

		this.config = new ProjectConfig() ; // is a ProjectConfig object.

		dirPopup.$.header.setContent("Select a directory containing the new project") ;
		dirPopup.$.hermesFileTree.showNewFolderButton();
		dirPopup.show();
	},

	// Step 2: once the directory is selected by user, show the project properties popup
	// Bail out if a project.json file already exists
	prepareShowProjectPropPopup: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		if (!inEvent.file) {
			this.hideMe();
			return;
		}

		var propW = this.$.propertiesWidget;
		this.selectedDir = inEvent.file;
		propW.setupCreate();
		propW.setTemplateList([]);		// Reset template list

		// Pre-fill project properties widget
		propW.preFill(ProjectConfig.PREFILLED_CONFIG_FOR_UI),
		propW.$.projectDirectory.setContent(this.selectedDir.path);
		propW.$.projectName.setValue(this.selectedDir.name);

		async.series([
				this.checkProjectJson.bind(this, inSender, inEvent),
				this.checkGetAppinfo.bind(this, inSender, inEvent),
				this.getTemplates.bind(this, inSender, inEvent),
				this.createProjectJson.bind(this, inSender, inEvent),
				this.showProjectPropPopup.bind(this, inSender, inEvent)
			], this.waitOk.bind(this));
	},

	checkProjectJson: function(inSender, inEvent, next) {
		// scan content for a project.json
		var matchFileName = function(node){
			return (node.content === 'project.json' ) ;
		};
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;
		var topNode = hft.$.serverNode ;
		var matchingNodes = topNode.getNodeFiles(hft.selectedNode).filter(matchFileName) ;

		if (matchingNodes.length !== 0) {
			this.hide();
			var msg = 'Cannot create project: a project.json file already exists';
			this.$.errorPopup.raise(msg);
			next({handled: true, msg: msg});
		} else {
			next();
		}
	},

	checkGetAppinfo: function(inSender, inEvent, next) {
		var propW = this.$.propertiesWidget;
		// scan content for an appinfo.json
		var matchFileName = function(node){
			return (node.content === 'appinfo.json' ) ;
		};
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;
		var topNode = hft.$.serverNode ;
		var matchingNodes = topNode.getNodeFiles(hft.selectedNode).filter( matchFileName ) ;

		if (matchingNodes.length === 1) {
			this.log("There is an appinfo.json", matchingNodes);
			var appinfoReq = this.selectedDir.service.getFile(matchingNodes[0].file.id);
			appinfoReq.response(this, function(inSender, fileStuff) {
				var info;
				try {
					info = JSON.parse(fileStuff.content);
				} catch(err) {
					this.hide();
					this.log( "Unable to partse appinfo.json >>" + fileStuff.content + "<<");
					var msg = 'Unable to parse appinfo.json: ' + err;
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
				var msg = 'Unable to retrieve appinfo.json';
				this.$.errorPopup.raise(msg);
				next({handled: true, msg: msg});
			});
		} else {
			// No appinfo.json found. Or more that one which should be a bug
			next();		// Just continue
		}
	},

	getTemplates: function(inSender, inEvent, next) {
		var propW = this.$.propertiesWidget;
		// Getting template list
		var service = ServiceRegistry.instance.getServicesByType('generate')[0];
		if (service) {
			var templateReq = service.getTemplates();
			templateReq.response(this, function(inSender, inData) {
				propW.setTemplateList(inData);
				next();				// Should we return immediately without waiting the answer ?
			});
			templateReq.error(this, function(inSender, inError) {
				this.log("Unable to get template list (" + inError + ")");
				this.$.errorPopup.raise('Unable to get template list');
				propW.setTemplateList([]);
				next();
			});
		} else {
			this.log("Unable to get template list (No service defined)");
			this.$.errorPopup.raise('Unable to get template list (No service defined)');
			propW.setTemplateList([]);
			next();
		}
	},

	createProjectJson: function(inSender, inEvent, next) {
		this.config.init({
			folderId:  this.selectedDir.id,
			service: this.selectedDir.service
		}, function(err) {
			if (err) {
				this.$.errorPopup.raise(err.toString());
				var testCallBack = inEvent.testCallBack;
				if (testCallBack) {
					testCallBack();
				}
				next({handled: true, msg: err.toString()});
			} else {
				next();
			}
		}.bind(this));
	},

	showProjectPropPopup: function(inSender, inEvent, next) {
		var testCallBack = inEvent.testCallBack;
		// once project.json is created, setup and show project properties widget
		this.$.selectDirectoryPopup.hide();
		this.$.propertiesWidget.show() ;
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
				this.$.selectDirectoryPopup.hide();
				this.hideMe();
				this.log("An error occured: ", err);
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

		this.log("Creating new project " + name + " in folderId=" + folderId + " (template: " + template + ")");
		this.config.setData(inEvent.data) ;
		this.config.save() ;

		if (template) {
			this.instanciateTemplate(inEvent);
		} else {
			this.projectReady(null, inEvent);
		}

		return true ; // stop bubble
	},
	$LS: function(msg, params) {
		var tmp = new enyo.g11n.Template($L(msg));
		return tmp.evaluate(params);
	},
	// step 4: populate the project with the selected template
	instanciateTemplate: function (inEvent) {

		var template = inEvent.template;
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
		var req = genService.generate(template, substitutions);
		req.response(this, this.populateProject);
		req.error(this, function(inSender, inError) {
			this.log("Unable to get the template files (" + inError + ")");
			this.$.errorPopup.raise('Unable to instanciate projet content from the template');
			this.doHideWaitPopup();
		});
	},

	// step 5: populate the project with the retrieved template files
	populateProject: function(inSender, inData) {
		var folderId = this.selectedDir.id;
		var service = this.selectedDir.service;

		// Copy the template files into the new project
		req = service.createFiles(folderId, {content: inData.content, ctype: inData.ctype});
		req.response(this, this.projectReady);
		req.error(this, function(inEvent, inData) {
			this.$.errorPopup.raise('Unable to create projet content from the template');
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

	/**
	 * Hide the whole widget. Typically called when ok or cancel is clicked
	 */
	hideMe: function() {
		this.config = null ; // forget ProjectConfig object
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
		onModifiedConfig: "saveProjectConfig"
	},
	components: [
		{kind: "ProjectProperties", name: "propertiesWidget"}
	],

	debug: false,
	targetProject: null,

	/**
	 * Step 1: start the modification by showing project properties widget
	 */
	start: function(target) {
		if (target) {
			var config = target.getConfig();
			this.targetProject = target ;
			this.$.propertiesWidget.setupModif() ;
			this.$.propertiesWidget.preFill(config.data);
			this.show();
		}
	},

	// step 2:
	saveProjectConfig: function(inSender, inEvent) {
		if (this.debug) { this.log("saving project config"); }

		if (! this.targetProject) {
			this.error("internal error: saveProjectConfig was called without a target project.") ;
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

	classes: "enyo-unselectable",
	events: {
		onAddProjectInList: ""
	},
	handlers: {
		onFileChosen: "searchProjects"
	},
	debug: false,

	importProject: function(service, parentDir, child) {
		this.debug && this.log('opening project.json from ' + parentDir.name ) ;

		service.getFile( child.id ).
			response(this, function(inSender, fileStuff) {
				var projectData={};
				this.debug && this.log( "file contents: '" + fileStuff.content + "'" ) ;

				try {
					projectData = JSON.parse(fileStuff.content)  ;
				} catch(e) {
					this.log("Error parsing project data: "+e.toString());
				}

				this.debug && this.log('Imported project ' + projectData.name + " from " + parentDir.id) ;

				this.doAddProjectInList({
					name: projectData.name || parentDir.name,
					folderId: parentDir.id,
					service: this.selectedFile.service
				});
			});
	},

	searchProjects: function (inSender, inEvent) {
		if (!inEvent.file) {
			this.hide();
			return;
		}

		var folderId = inEvent.file.id ;
		var service = inEvent.file.service;

		var hft = this.$.hermesFileTree ;

		// we cannot use directly listFiles as this method sends a list of unrelated files
		// we need to use the file tree to be able to relate a project.json with is parent dir.
		var topDir = hft.selectedNode.file ;

		// construct an (kind of) iterator that will scan all directory of the
		// HFT and look for project.json
		var toScan = [ [ null , topDir ] ]	; // list of parent_dir , child
		// var this = this ;

		var iter, inIter ;

		inIter = function() {
			var item = toScan.shift() ;
			var parentDir = item[0] ;
			var child = item[1];
			this.debug && this.log('search iteration on ' + child.name + ' isDir ' + child.isDir ) ;

			service.listFiles(child.id)
				.response(this, function(inSender, inFiles) {
					var toPush = [] ;
					var foundProject = false ;
					enyo.forEach(inFiles, function(v) {
						if ( v.name === 'project.json' ) {
							foundProject = true ;
							this.importProject(service, child, v) ;
						}
						else if ( v.isDir ===  true ) {
							this.debug && this.log('pushing ' + v.name + " from " + child.id) ;
							toPush.push([child,v]);
						}
						// else skip plain file
					},this) ;

					if (! foundProject ) {
						// black magic required to push the entire array
						toScan.push.apply(toScan, toPush);
					}

					iter.apply(this) ;
				}
			) ;
		} ;

		iter = function() {
			while (toScan.length > 0) {
				inIter.apply(this) ;
			}
		} ;

		iter.apply(this) ; // do not forget to launch the whole stuff
		this.hide();
	}
});

