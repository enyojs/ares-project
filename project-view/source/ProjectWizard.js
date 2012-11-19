enyo.kind({
	name: "ProjectWizardCreate",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

	classes: "enyo-unselectable",
	events: {
		onConfirmCreateProject: "", 
		onConfirmConfigProject: ""
	},
	handlers: {
		onDirectorySelected: "customizeNamePopup"
	},

	components: [
		{kind: "FittableRows", canGenerate: true, fit: true, name: "changeNamePopup", components: [
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Project name: "},
				{kind: "onyx.InputDecorator", components: [
					{kind: "Input", defaultFocus: true, name: "projectName"}
				]}
			]},
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Directory:"},
				{kind: "Control", content: "", name: "projectDirectory", fit: true}
			]},
			{fit: true},
			{kind: "FittableColumns", style: "margin-top: 10px", components: [
				{kind: "Control", fit: true},
				{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "hide"},
				{kind: "onyx.Button", classes: "onyx-affirmative", content: "OK", ontap: "createProject"}
			]}
		]},
		{name: "errorPopup", kind: "Ares.ErrorPopup", msg: "unknown error"},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup", onCancel: "hideMe"}
	],
	debug: true,
	showDirPopup: function(inSender, inEvent) {
		return this.$.selectDirectoryPopup.show();
	},
	addProjectInList: function(name, folderId) {
		this.hide();
		this.doConfirmCreateProject({name: name, folderId: folderId, service: this.selectedDir.service, serviceId: this.selectedServiceId});
	},
	createProjectInView: function(name, folderId) {
		this.addProjectInList(name,folderId);
		this.doConfirmConfigProject({name: name, folderId: folderId, service: this.selectedDir.service});
	},
	reset: function() {
		this.$.projectName.setValue("");
		this.$.projectDirectory.setContent("");
		this.$.changeNamePopup.hide() ;
		return this ;
	},
	hideMe: function() {
		this.hide() ;	
		return true;
	},
	start: function() {
		this.log("starting") ;
		this.reset().show();
		this.$.changeNamePopup.hide() ;
		this.$.selectDirectoryPopup.$.header.setContent("Select a directory containing the new project") ;
		this.showDirPopup();
	},
	createProject: function (inSender, inEvent) {
		var name = this.$.projectName.getValue();
		var subDir = this.$.projectDirectory.getContent() ;
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
			this.createProjectInView(name, folderId) ;
		}
		else {
			this.hide() ;
			this.$.errorPopup.raise('Cannot create project: a project.json file already exists');
		}
	},
	customizeNamePopup: function(inSender, inEvent) {
		this.log("shown") ;
		this.selectedServiceId = inEvent.serviceId;
		this.selectedDir = inEvent.directory;
		this.$.projectDirectory.setContent(this.selectedDir.path);
		this.$.projectName.setValue(this.selectedDir.name);
		this.$.selectDirectoryPopup.hide();
		this.$.changeNamePopup.show() ;
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

