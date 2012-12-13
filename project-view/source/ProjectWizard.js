enyo.kind({
	name: "ProjectWizardCreate",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

	classes: "enyo-unselectable",
	events: {
		onAddProjectInList: ""
	},
	handlers: {
		onDirectorySelected: "showProjectPropPopup",
		onModifiedConfig: "createProject" ,
		// can be canceled by either of the included components
		onDone: "hideMe"
	},

	components: [
		{kind: "ProjectProperties", name: "propertiesWidget"},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup"},
		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"}
	],
	debug: false,

	/**
	 * start project creation by showing direction selection widget
	 */
	start: function() {
		var dirPopup = this.$.selectDirectoryPopup ;

		this.log("starting") ;
		this.show();

		this.config = new ProjectConfig() ; // is a ProjectConfig object.

		dirPopup.$.header.setContent("Select a directory containing the new project") ;
		dirPopup.$.hermesFileTree.showNewFolderButton();
		dirPopup.show();
	},

	// Step 2: once the directory is selected by user, show the project properties popup
	// Bail out if a project.json file already exists
	showProjectPropPopup: function(inSender, inEvent) {
		var propW = this.$.propertiesWidget ;
		var that = this ;

		// scan content for a project.json
		var matchFileName = function(node){
			return (node.content === 'project.json' ) ;
		};
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;
		var matchingNodes = hft.getNodeFiles(hft.selectedNode).filter( matchFileName ) ;

		if ( matchingNodes.length !== 0 ) {
			this.hide() ;
			this.$.errorPopup.raise('Cannot create project: a project.json file already exists');
			return ;
		}

		// ok, we can go on with project properties setup
		propW.setupCreate() ;

		this.selectedServiceId = inEvent.serviceId;
		this.selectedDir = inEvent.directory;

		// creates a project.json file
		this.config.init({
			folderId:  this.selectedDir.id,
			service: this.selectedDir.service
		}, function(err) {
			if (err) {
				that.$.errorPopup.raise(err.toString()) ;
			}
			else {
				// once project.json is created, setup and show project properties widget
				propW.preFill(ProjectConfig.PREFILLED_CONFIG_FOR_UI),
				propW.$.projectDirectory.setContent(that.selectedDir.path);
				propW.$.projectName.setValue(that.selectedDir.name);
				that.$.selectDirectoryPopup.hide();
				propW.show() ;
			}
		});
	},

	// step 3: actually create project in ares data structure
	createProject: function (inSender, inEvent) {
		var name = inEvent.data.name;
		var folderId = this.selectedDir.id ;
		var service = this.selectedDir.service;

		this.log("Creating new project " + name + " in folderId=" + folderId);
		this.doAddProjectInList({
			name: name,
			folderId: folderId,
			service: this.selectedDir.service,
			serviceId: this.selectedServiceId
		});
		this.config.setData(inEvent.data) ;
		this.config.save() ;

		return true ; // stop bubble
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
			WorkspaceData.projects.renameProject(oldName, inEvent.data.name);
		}

		return true ; // stop bubble
	}
});


/**
 * This kind will scan a directory. It will create a new project for each project.json found.
 */
enyo.kind({
	name: "ProjectWizardScan",
	kind: "SelectDirectoryPopup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

	classes: "enyo-unselectable",
	events: {
		onAddProjectInList: ""
	},
	handlers: {
		onDirectorySelected: "searchProjects"
	},
	debug: false,

	searchProjects: function (inSender, inEvent) {
		var folderId = inEvent.directory.id ;
		var service = inEvent.directory.service;

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
			if ( child.name === 'project.json' ) {
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
							service: this.selectedDir.service,
							serviceId: this.selectedServiceId
						});
					});
			}
			if ( child.isDir ===  true ) {
				this.debug && this.log('opening dir ' + child.name ) ;
				service.listFiles(child.id)
					.response(this, function(inSender, inFiles) {
						enyo.forEach(inFiles, function(v) {
							this.debug && this.log('pushing ' + v.name + " from " + child.id) ;
							toScan.push([child,v]);
						},this) ;
						iter.apply(this) ;
					}
				) ;
			}
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

