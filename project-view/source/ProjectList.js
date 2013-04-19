/**
 * This kind provides:
 * - the project toolbars (with create .. delete)
 * - the project list
/*
 * The project list is a simple kind that only holds project names. It does not
 * hold project objects or kinds.
 */
enyo.kind({
	name: "ProjectList",
	classes: "enyo-unselectable ares-project-list",
	events: {
		onCreateProject: "",
		onProjectSelected: "",
		onScanProject: "",
		onProjectRemoved: "",
		onModifySettings: "",
		onBuildProject: "",
		//onInstallProject: "",
		//onRunProject: "",
		//onDebugProject: "",
		onPreviewProject: "",
		onError: ""
	},
	debug: true,
	components: [
		/*{kind: "onyx.Toolbar", classes: "onyx-toolbar onyx-menu-toolbar ares-top-toolbar", isContainer: true, name: "toolbar", components: [
			{classes: "aresmenu" , components: [
				{tag:'span', content:'Ares', ontap: "aresMenuTapped"},
				{classes:'lsmallDownArrow', ontap: "aresMenuTapped",},
				{name: 'amenu', tag:'ul', components:[
					{name: 'account',   id:'account', tag:'li', kind: 'control.Link', content: "Accounts...", ontap:"showAccountConfigurator", onmouseup:"aresMenuHide"},
					{name: 'properties',   id:'properties',   tag:'li', kind: 'control.Link', content: "Properties..."}*/
		{kind: "onyx.MoreToolbar", classes: "onyx-menu-toolbar ares_harmonia_toolBar ares-no-padding", isContainer: true, name: "toolbar", components: [
			{kind: "onyx.MenuDecorator", onSelect: "menuItemSelected", components: [
				{content: "Ares"},
				{kind: "onyx.Menu", components: [
					{value: "showAccountConfigurator", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/ares_accounts.png"},
						{content: "Accounts..."}
					]},
					{classes: "onyx-menu-divider"},
					{content: "Properties..."}
				]}
			]},
			{kind: "onyx.MenuDecorator", onSelect: "menuItemSelected", components: [
				{content: "Edit"},
				{kind: "onyx.Menu", components: [
					{value: "doCreateProject", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_new.png"},
						{content: "Create..."}
					]},
					{value: "doScanProject", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_import.png"},
						{content: "Import..."}
					]},
					{classes: "onyx-menu-divider"},
					{value: "removeProjectAction", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_delete.png"},
						{content: "Delete"}
					]}
				]}
			]},
			{kind: "onyx.MenuDecorator", onSelect: "menuItemSelected", components: [
				{content: "Project", name: "projectMenu", disabled: true},
				{kind: "onyx.Menu", components: [
					{value: "doModifySettings", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_edit.png"},
						{content: "Edit..."}
					]},
					{classes: "onyx-menu-divider"},
					{value: "doPreviewProject", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_preview.png"},
						{content: "Preview"}
					]},
					{classes: "onyx-menu-divider"},
					{value: "doBuildProject", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_build.png"},
						{content: "Build..."}
					]},
					{value: "doInstallProject", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_install.png"},
						{content: "Install..."}
					]},
					{value: "doRunProject", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_run.png"},
						{content: "Run..."}
					]},
					{classes: "onyx-menu-divider"},
					{value: "doDebugProject", components: [
						{kind: "onyx.IconButton", src: "$project-view/assets/images/project_view_debug.png"},
						{content: "Debug...", classes: "onyx-disabled" }
					]}
				]}
			]}
		]},
		{content:"Project list", classes:"project-list-title title-gradient"},
		{kind: "enyo.Scroller", components: [
			{tag:"ul", kind: "enyo.Repeater", controlParentName: "client", fit: true, name: "projectList", onSetupItem: "projectListSetupItem", ontap: "projectListTap", components: [
				{tag:"li",kind: "ProjectList.Project", name: "item"}
			]}
		]},
		{classes:"hangar"},
		{name: "removeProjectPopup", kind: "ProjectDeletePopup", onConfirmDeleteProject: "confirmRemoveProject"},
		{kind: "AccountsConfigurator"}
	],
	selected: null,
	create: function() {
		this.inherited(arguments);
		this.$.projectList.setCount(Ares.Workspace.projects.length);
		Ares.Workspace.projects.on("add remove reset", enyo.bind(this, this.projectCountChanged));
	},
	aresMenuTapped: function() {
		this.$.amenu.show();
		if(this.$.amenu.hasClass('on')) {
			this.$.amenu.removeClass('on');
		}
		else {
			this.$.amenu.addClass('on');
		}
	},
	aresMenuHide: function() {
		this.$.amenu.hide();
	},
	projectCountChanged: function() {
		var count = Ares.Workspace.projects.length;
		this.$.projectList.setCount(count);
		this.$.projectList.render();
		this.doProjectRemoved();		// To reset the Harmonia view
	},
	/**
	 * Generic event handler
	 * @private
	 */
	menuItemSelected: function(inSender, inEvent) {
		if (this.debug) this.log("sender:", inSender, ", event:", inEvent);
		var fn = inEvent && inEvent.selected && inEvent.selected.value;
		if (typeof this[fn] === 'function') {
			this[fn]({project: this.selectedProject});
		} else {
			if (this.debug) this.log("*** BUG: '" + fn + "' is not a known function");
		}
	},
	addProject: function(name, folderId, service) {
		var serviceId = service.getConfig().id || "";
		if (serviceId === "") {
			throw new Error("Cannot add a project in service=" + service);
		}
		var known = Ares.Workspace.projects.get(name);
		if (known) {
			this.debug && this.log("Skipped project " + name + " as it is already listed") ;
		} else {
			Ares.Workspace.projects.createProject(name, folderId, serviceId);
		}
	},
	removeProjectAction: function(inSender, inEvent) {
		var popup = this.$.removeProjectPopup;
		if (this.selected) {
			popup.setName("Remove project '" + this.selected.getProjectName() + "' from list?");
			popup.$.nukeFiles.setValue(false) ;
			popup.show();
		}
	},
	confirmRemoveProject: function(inSender, inEvent) {
		// use file system service to remove project files (which behaves like a 'rm -rf')
		// once done,  call removeSelectedProjectData to mop up the remains.
		var project, nukeFiles ;
		if (this.selected) {
			project = Ares.Workspace.projects.at(this.selected.index);
			nukeFiles = this.$.removeProjectPopup.$.nukeFiles.getValue() ;
			this.debug && this.log("removing project" +  project.getName() + ( nukeFiles ? " and its files" : "" )) ;
			this.debug && this.log(project);
			if (nukeFiles) {
				var service = project.getService();
				var folderId = project.getFolderId();
				service.remove( folderId )
					.response(this, function(){this.removeSelectedProjectData();})
					.error(this, function(inError){
						this.doError({msg: "Error removing files of project " + project.name + ": " + inError.toString(), err: inError});
					}) ;
			}
			else {
				this.removeSelectedProjectData() ;
			}
		}
	},
	removeSelectedProjectData: function() {
		if (this.selected) {
			// remove the project from list of project config
			var name = Ares.Workspace.projects.at(this.selected.index).getName();
			Ares.Workspace.projects.removeProject(name);
			this.selected = null;
			this.doProjectRemoved();
			this.$.projectMenu.setDisabled(true);
		}
	},
	projectListSetupItem: function(inSender, inEvent) {
		var project = Ares.Workspace.projects.at(inEvent.index);
		var item = inEvent.item;
		// setup the controls for this item.
		item = item.$.item;
		item.setProjectName(project.getName());
		item.setIndex(inEvent.index);
	},
	projectListTap: function(inSender, inEvent) {
		var project, msg, service;
		// Highlight the new project item
		if (this.selected) {
			this.selected.removeClass("on");
		}
		if (inEvent.originator.kind === 'ProjectList.Project') {
			this.selected = inEvent.originator;
		} else {
			this.selected = inEvent.originator.owner;
		}
		this.selected.addClass("on");

		project = Ares.Workspace.projects.at(inEvent.index);
		service = ServiceRegistry.instance.resolveServiceId(project.getServiceId());
		if (service !== undefined) {
			project.setService(service);
			this.$.projectMenu.setDisabled(false);
			this.selectedProject = project;
			this.doProjectSelected({project: project});
		} else {
			// ...otherwise let
			msg = "Service " + project.getServiceId() + " not found";
			this.doError({msg: msg});
			this.error(msg);
		}
	},
	showAccountConfigurator: function() {
		this.$.accountsConfigurator.show();
	},
	
	showErrorPopup : function(msg) {
		this.$.errorPopup.setErrorMsg(msg);
		this.$.errorPopup.show();
	},

	stringifyReplacer: function(key, value) {
		if (key === "originator") {
			return undefined;	// Exclude
		}
		return value;	// Accept
	},
	launchPreview: function(inSender, inEvent) {
		if (inEvent) {
			this.doPreview(inEvent.originator.value) ;
		}
		return true ;
	}
});

enyo.kind({
	name: "ProjectList.Project",
	kind: "control.Link",
	published: {
		projectName: "",
		index: -1
	},
	components: [
		{name: "name"}
	],
	projectNameChanged: function(inOldValue) {
		this.$.name.setContent(this.projectName);
	}
});

enyo.kind({
	name: "ProjectDeletePopup",
	kind: "Ares.ActionPopup",
	components: [
		{kind: "Control", classes: "ares-title", content: " ", name: "title"},
		{kind: "Control", classes: "ares-message", components: [
			{kind: "onyx.Checkbox", checked: false, name: "nukeFiles", onchange: "nukeChanged"},
			{kind: "Control", tag: "span", classes: "ares-padleft", content: "also delete files from disk"},
		]},
		{kind: "FittableColumns", name: "buttons", components: [
			{kind: "onyx.Button", content: "Cancel", name: "cancelButton", ontap: "actionCancel"},
			{fit: true},
			{kind: "onyx.Button", content: "Remove", name: "actionButton", ontap: "actionConfirm"}
		]}
	],
	handlers: {
		onShow: "shown"
	},
	shown: function(inSender, inEvent) {
		var w = this.$.actionButton.getBounds().width;
		this.$.actionButton.setBounds({width: w});
		this.nukeChanged();
	},
	nukeChanged: function(inSender, inEvent) {
		if (this.$.nukeFiles.checked) {
			this.$.actionButton.setContent("Delete");
		} else {
			this.$.actionButton.setContent("Remove");
		}
	}
});
