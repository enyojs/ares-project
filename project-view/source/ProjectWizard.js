enyo.kind({
	name: "ProjectWizardAny",
	kind: "onyx.Popup",
	modal: true,
	centered: true,
	floating: true,
	autoDismiss: false,

	classes: "enyo-unselectable",
	handlers: {
		onDirectorySelected: "directorySelected"
	},

	showDirPopup: function(inSender, inEvent) {
		this.$.selectDirectoryPopup.show();
	},
	addProjectInList: function(name, folderId) {
		this.hide();
		this.doConfirmCreateProject({name: name, folderId: folderId, service: this.selectedDir.service, serviceId: this.selectedServiceId});
	},
	createProjectInView: function(name, folderId) {
		this.addProjectInList(name,folderId);
		this.doConfirmConfigProject({name: name, folderId: folderId, service: this.selectedDir.service});
	}
});

enyo.kind({
	name: "ProjectWizardCreate",
	kind: "ProjectWizardAny",

	events: {
		onConfirmCreateProject: "", 
		onConfirmConfigProject: ""
	},
	components: [
		{kind: "FittableRows", fit: true, components: [
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Project name: "},
				{kind: "onyx.InputDecorator", components: [
					{kind: "Input", defaultFocus: true, placeholder: "Enter project name", name: "projectName", oninput: "updateProjectDir"}
				]}
			]},
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Location:"},
				{kind: "Control", content: "", name: "projectLocation", fit: true},
				{kind: "onyx.Button", content: "Browse", ontap: "showDirPopup"}
			]},
			{kind: "FittableColumns", name: "fittableColumns4", components: [
				{kind: "Control", content: "Project directory:"},
				{kind: "onyx.InputDecorator", components: [
					{kind: "onyx.Input", name: "projectDirectory", onchange: "enableConfirmButton"}
				]}
			]},
			{fit: true},
			{kind: "FittableColumns", style: "margin-top: 10px", name: "fittableColumns5", components: [
				{kind: "Control", fit: true},
				{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "hide"},
				{kind: "onyx.Button", classes: "onyx-affirmative", content: "OK", name: "confirm", ontap: "createProject"}
			]}
		]},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup", onCancel: "cancelDirSelection"}
	],
	debug: true,
	reset: function() {
		this.$.projectName.setValue("");
		this.$.projectDirectory.setValue("");
		this.$.confirm.setDisabled(true);
		return this ;
	},
	cancelDirSelection: function() {
		this.$.selectDirectoryPopup.hide();
	},
	createProject: function (inSender, inEvent) {
		var name = this.$.projectName.getValue();
		var subDir = this.$.projectDirectory.getValue() ;
		var folderId = this.selectedDir.id ;
		var service = this.selectedDir.service;
		var matchDirName = function(node){
			return (node.content === name) ;
		};
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;
		var matchingNodes = hft.getNodeFiles(hft.selectedNode).filter( matchDirName ) ;
			
		if ( matchingNodes.length === 0 ) {
			this.debug && this.log("Creating new folder " + name + " into folderId=" + folderId);

			service
				.createFolder(folderId, subDir)
				.response(this, function(inSender, newFolderId) {
					this.createProjectInView(name, newFolderId) ;
			})
			.error(this, function(inSender, inError) {
				// TODO display a popup to notify the error
				this.log("Error: "+inError);
				this.$.selectDirectoryPopup.hide();
			});
		}
		else {
			this.createProjectInView(name, matchingNodes[0].file.id) ;
		}
	},
	directorySelected: function(inSender, inEvent) {
		this.selectedServiceId = inEvent.serviceId;
		this.selectedDir = inEvent.directory;
		this.$.projectLocation.setContent(this.selectedDir.path);
		this.enableConfirmButton();
		this.$.selectDirectoryPopup.hide();
	},
	updateProjectDir: function() {
		this.$.projectDirectory.setValue(this.$.projectName.getValue()) ;
		this.enableConfirmButton() ;
	},
	enableConfirmButton: function() {
		if (	this.$.projectDirectory.getValue() 
			 && this.$.projectName	   .getValue() 
			 && this.$.projectLocation .getContent()
		) {
			this.$.confirm.setDisabled(false);
		} else {
			this.$.confirm.setDisabled(true);
		}
	}
});

enyo.kind({
	name: "ProjectWizardImport",
	kind: "ProjectWizardAny",
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
		onDirectorySelected: "directorySelected"
	},
	components: [
		{kind: "FittableRows", fit: true, components: [
			{kind: "Control", content:"Select a location containing one or mode project.json"},
			{fit: true},
			{kind: "FittableColumns", components: [
				{kind: "Control", content: "Location:"},
				{kind: "Control", content: "", name: "projectLocation", fit: true},
				{kind: "onyx.Button", content: "Browse", ontap: "showDirPopup"}
			]},
			{fit: true},
			{kind: "FittableColumns", style: "margin-top: 10px", name: "fittableColumns5", components: [
				{kind: "onyx.Button", content: "Cancel", ontap: "hide"},
				{kind: "Control", fit: true},
				{kind: "onyx.Button", content: "OK", name: "confirm", ontap: "searchProjects"}
			]}
		]},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup", onCancel: "cancelDirSelection"}
	],
	debug: false,
	reset: function() {
		this.$.confirm.setDisabled(true);
		return this ;
	},
	cancelDirSelection: function() {
		this.$.selectDirectoryPopup.hide();
	},
	searchProjects: function (inSender, inEvent) {
		var folderId = this.selectedDir.id ;
		var service = this.selectedDir.service;
		var hft = this.$.selectDirectoryPopup.$.hermesFileTree ;

		// we cannot use directly listFiles as this method sends a list of unrelated files
		// we need to use the file tree to be able to relate a project.json with is parent dir.
		var topDir = hft.selectedNode.file ;

		// construct an (kind of) iterator that will scan all directory of the 
		// HFT and look for project.json
		var toScan = [ [ null , topDir ] ]	; // list of parent_dir , child
		// var this = this ;

		var iter = function() {
			while (toScan.length > 0) {
				var item = toScan.shift() ;
				var parentDir = item[0] ;
				var child = item[1];
				this.log('search iteration on ' + child.name + ' isDir ' + child.isDir ) ;
				if ( child.name === 'project.json' ) { 
					this.log('opening project.json from ' + parentDir.name ) ;
					service.getFile( child.id ).
						response(this, function(inSender, fileStuff) {
							this.log( "file contents: '" + fileStuff.content + "'" ) ;
							var projectData = JSON.parse(fileStuff.content)  ;
							this.log('Imported project ' + projectData.name ) ;
							this.addProjectInList(projectData.name, parentDir.id) ;
						}); 
				}
				if ( child.isDir ===  true ) { 
					service.listFiles(child.id)
						.response(this, function(inSender, inFiles) {
							enyo.forEach(inFiles, function(v) {
								this.log('pushing ' + v.name) ;
								toScan.push([child,v]);
							},this) ;
							iter.apply(this) ;
						}
					) ;
				}
			}
		} ;

		iter.apply(this) ; // oops. forgot to launch the whole stuff
	},
	directorySelected: function(inSender, inEvent) {
		this.selectedServiceId = inEvent.serviceId;
		this.selectedDir = inEvent.directory;
		this.$.projectLocation.setContent(this.selectedDir.path);
		this.enableConfirmButton();
		this.$.selectDirectoryPopup.hide();
	},
	enableConfirmButton: function() {
		if ( this.$.projectLocation .getContent()) {
			this.$.confirm.setDisabled(false);
		} else {
			this.$.confirm.setDisabled(true);
		}
	}
});

