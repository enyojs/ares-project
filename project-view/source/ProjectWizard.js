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
		onDirectorySelected: "customizeNamePopup",
		onModifiedConfig: "createProject" ,
		// can be canceled by either of the included components
		onDone: "hideMe"
	},

	components: [
		{kind: "ProjectProperties", name: "propertiesWidget"},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup"}
	],
	debug: true,
	create: function() {
		this.inherited(arguments);
		this.$.propertiesWidget.setupCreate() ;
		this.$.selectDirectoryPopup.$.hermesFileTree.showNewFolderButton();
	},
	showDirPopup: function(inSender, inEvent) {
		return this.$.selectDirectoryPopup.show();
	},
	reset: function() {
		this.$.propertiesWidget.preFill({
			id: "",
			name: "",
			version: "",
			title: "",
			description: "",
			build: {
				phonegap: {
					enabled: true
				}
			}
		}) ;
		return this ;
	},

	/**
	 * Hide the whole widget. Typically called when ok or cancel is clicked
	 */
	hideMe: function() {
		this.config = null ; // forget ProjectConfig object
		this.hide() ;	
		return true;
	},

	/**
	 * start project creation by showing the widget
	 */
	start: function() {
		this.log("starting") ;
		this.reset().show();
		this.config = new ProjectConfig() ; // is a ProjectConfig object.
		//this.$.changeNamePopup.hide() ;
		this.$.selectDirectoryPopup.$.header.setContent("Select a directory containing the new project") ;
		this.showDirPopup();
	},
	createProject: function (inSender, inEvent) {
		var name = inEvent.data.name;
		var subDir = this.$.selectDirectoryPopup.getContent() ;
		var folderId = this.selectedDir.id ;
		var service = this.selectedDir.service;

		// don't create folder here, just scan content for a project.json
		var matchFileName = function(node){
			return (node.content === 'project.json' ) ;
		};
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;
		var matchingNodes = hft.getNodeFiles(hft.selectedNode).filter( matchFileName ) ;
			
		if ( matchingNodes.length === 0 ) {
			this.log("Creating new project " + name + " in folderId=" + folderId);
			this.hide();
			this.doAddProjectInList({
				name: name,
				folderId: folderId,
				service: this.selectedDir.service,
				serviceId: this.selectedServiceId
			});
			this.config.setData(inEvent.data) ;
			this.config.save() ;
		}
		else {
			this.hide() ;
			this.$.errorPopup.raise('Cannot create project: a project.json file already exists');
		}

		return true ; // stop bubble
	},
	customizeNamePopup: function(inSender, inEvent) {
		var propW = this.$.propertiesWidget ;
		var that = this ;
		this.log("shown") ;

		this.selectedServiceId = inEvent.serviceId;
		this.selectedDir = inEvent.directory;

		this.config.init({
			folderId:  this.selectedDir.id,
			service: this.selectedDir.service
		}, function(err) {
			if (err) {
				that.showErrorPopup(err.toString()) ;
			}
			else {
				propW.$.projectDirectory.setContent(that.selectedDir.path);
				propW.$.projectName.setValue(that.selectedDir.name);
				that.$.selectDirectoryPopup.hide();
				propW.show() ;
			};
		});
	}
});

	}
});

enyo.kind({
	name: "ProjectWizardScan",
	kind: "SelectDirectoryPopup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

	classes: "enyo-unselectable",
	events: {
		onConfirmCreateProject: ""
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
						this.debug && this.log( "file contents: '" + fileStuff.content + "'" ) ;
						var projectData = JSON.parse(fileStuff.content)  ;
						this.log('Imported project ' + projectData.name + " from " + parentDir.id) ;
						this.doConfirmCreateProject({
							name: projectData.name,
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

