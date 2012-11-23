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
		{kind: "onyx.RadioGroup", onActivate: "switchPanel", name: "thumbnail", components: [
			{content: "Project", attributes: {title: 'click to edit project attributes'}},
			{content: "PhoneGap"}
		]},
		{name: "changeNamePopup", components: [
			{content: "Project", tag:"h2"},
			{tag: 'table', components: [
				{tag: "tr" , components: [
					 {tag: "td" , content: "Name: "},
					 {tag: 'td', components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", defaultFocus: true, name: "projectName"}
						  ]}
					 ]},
					 {tag: 'td', content: "Title: "},
					 {tag: "td" , components: [
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", defaultFocus: true, name: "projectTitle"}
						   ]}
					  ]}
				]},
				{tag: "tr" , components: [
					 {tag: "td" , content: "Version: "},
					 {tag: 'td', components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", defaultFocus: true, name: "projectVersion"}
						  ]}
					 ]},
					 {tag: 'td', content: "Id: "},
					 {tag: "td" , components: [
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", defaultFocus: true, name: "projectId", 
								attributes: {title: "Application ID in reverse domain-name format: com.example.apps.myapp"}}
						   ]}
					  ]}
				]},
				{tag: "tr" , components: [
					 {tag: "td", content: "Directory: "},
					 {tag: 'td', attributes: {colspan: 3}, content: "", name: "projectDirectory" }
				]}
			]}
		]},
		{name: "phoneGapSettings", components: [
			{content: "PhoneGap", tag:"h2"},
			{kind: "onyx.ToggleButton", onContent: "enabled", offContent: "disabled", onChange: "togglePhonegap"},
			{tag: 'table', attributes: {'class': 'ares_projectView_table'}, components: [
				{tag: "tr" , components: [
					 {tag: "td" , content: "AppId: "},
					 {tag: 'td', attributes: {colspan: 3}, components:[
						  {kind: "onyx.InputDecorator", components: [
							   {kind: "Input", name: "phonegapId"}
						   ]}
					 ]}
				]},
				{tag: "tr" , components: [
					 {tag: 'td', content: "Target", attributes: {colspan: 3}}
				]},
				{tag: "tr" , components: [
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", onContent: "Android", offContent: "Android", onChange: "toggleIos"}
					]},
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", onContent: "Ios", offContent: "Ios", onChange: "toggleIos"}
					]},
					{tag: "td" , components: [

						  {kind: "onyx.ToggleButton", onContent: "Winphone", offContent: "Winphone", onChange: "toggleIos"}
					]},
				]},
				{tag: "tr" , components: [
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", onContent: "Blackberry", offContent: "Blackberry", onChange: "toggleIos"}
					]},
					{tag: "td" , components: [
						  {kind: "onyx.ToggleButton", onContent: "Webos", offContent: "Webos", onChange: "toggleIos"}
					]}
				]}
			]}
		]},
		// FIXME: there should be an HTML/CSS way to avoid using FittableStuff...
		{kind: "FittableRows", style: "margin-top: 10px; width: 100%", fit: true, components: [
			{kind: "onyx.Button", classes: "onyx-negative", content: "Cancel", ontap: "hide"},
			{kind: "onyx.Button", classes: "onyx-affirmative", content: "OK", ontap: "createProject"}
		]},
		{kind: "Ares.ErrorPopup", name: "errorPopup", msg: "unknown error"},
		{kind: "SelectDirectoryPopup", canGenerate: false, name: "selectDirectoryPopup", onCancel: "hideMe"}
	],
	debug: true,
	create: function() {
		this.inherited(arguments);
		this.$.selectDirectoryPopup.$.hermesFileTree.showNewFolderButton();
	},
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

	/**
	 * Hide the whole widget. Typically called when ok or cancel is clicked
	 */
	hideMe: function() {
		this.hide() ;	
		return true;
	},

	/**
	 * start project creation by showing the widget
	 */
	start: function(config) {
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

